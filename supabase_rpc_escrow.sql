-- =============================================
-- CJ EXPERTOS — RPCs de Escrow / Pagos
-- Ejecutar en: Supabase → SQL Editor → New query
-- DESPUÉS de supabase_schema_v2.sql
-- =============================================
-- Cuatro funciones atómicas:
--   1. liberar_60_porciento(licitacion_id)
--   2. aprobar_etapa(etapa_id, comentario)
--   3. rechazar_etapa(etapa_id, motivo)
--   4. finalizar_obra(licitacion_id)  ← versión licitaciones
-- =============================================

-- ─────────────────────────────────────────────────────────────
-- HELPER PRIVADO: carpintero adjudicado de una licitación
-- ─────────────────────────────────────────────────────────────
create or replace function public._carpintero_adjudicado(p_licitacion_id uuid)
returns uuid
language sql stable security definer set search_path = public as $$
  select carpintero_id
  from public.cotizaciones
  where licitacion_id = p_licitacion_id
  order by created_at asc   -- se toma la primera en caso de empate;
                             -- en producción usar un campo adjudicada=true
  limit 1;
$$;

-- ─────────────────────────────────────────────────────────────
-- HELPER PRIVADO: monto total de la licitación (cotización
-- adjudicada)
-- ─────────────────────────────────────────────────────────────
create or replace function public._monto_adjudicado(p_licitacion_id uuid)
returns numeric
language sql stable security definer set search_path = public as $$
  select monto
  from public.cotizaciones
  where licitacion_id = p_licitacion_id
  order by created_at asc
  limit 1;
$$;

-- ============================================================
-- 1. liberar_60_porciento
-- ============================================================
-- Propósito:
--   Libera el 60 % del monto adjudicado al carpintero como
--   anticipo para compra de materiales.
--   Requisitos: licitación en estado 'adjudicada', no haberse
--   liberado antes este tramo.
-- ============================================================
create or replace function public.liberar_60_porciento(
  p_licitacion_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lic           record;
  v_carpintero_id uuid;
  v_monto_total   numeric(12,2);
  v_monto_60      numeric(12,2);
  v_ya_liberado   boolean;
begin

  -- 1. Cargar licitación
  select * into v_lic
  from public.licitaciones
  where id = p_licitacion_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND',
      'mensaje', 'Licitación no encontrada.');
  end if;

  -- 2. Verificar que quien llama es cliente dueño o admin
  if v_lic.cliente_id <> auth.uid() and not public.es_admin() then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN',
      'mensaje', 'Solo el cliente dueño puede liberar fondos.');
  end if;

  -- 3. Estado válido
  if v_lic.estado not in ('adjudicada', 'en_curso') then
    return jsonb_build_object('ok', false, 'code', 'ESTADO_INVALIDO',
      'mensaje', 'La licitación debe estar adjudicada o en curso para liberar fondos.');
  end if;

  -- 4. ¿Ya se liberó el tramo 2?
  select exists(
    select 1 from public.pagos
    where licitacion_id = p_licitacion_id
      and tramo = 2
      and estado = 'confirmado'
  ) into v_ya_liberado;

  if v_ya_liberado then
    return jsonb_build_object('ok', false, 'code', 'YA_LIBERADO',
      'mensaje', 'El 60% ya fue liberado previamente.');
  end if;

  -- 5. Obtener carpintero y monto
  v_carpintero_id := public._carpintero_adjudicado(p_licitacion_id);
  v_monto_total   := public._monto_adjudicado(p_licitacion_id);

  if v_carpintero_id is null or v_monto_total is null then
    return jsonb_build_object('ok', false, 'code', 'SIN_COTIZACION',
      'mensaje', 'No se encontró cotización adjudicada.');
  end if;

  v_monto_60 := round(v_monto_total * 0.60, 2);

  -- 6. Registrar pago tramo 2
  insert into public.pagos (licitacion_id, tramo, monto, metodo, estado)
  values (p_licitacion_id, 2, v_monto_60, 'transferencia', 'confirmado');

  -- 7. Acreditar en billetera del carpintero
  update public.perfiles
  set saldo_billetera = coalesce(saldo_billetera, 0) + v_monto_60
  where id = v_carpintero_id;

  -- 8. Movimiento
  insert into public.movimientos (perfil_id, tipo, monto, descripcion)
  values (
    v_carpintero_id,
    'credito',
    v_monto_60,
    'Liberación 60% materiales — licitación ' || p_licitacion_id
  );

  -- 9. Pasar a en_curso si estaba adjudicada
  update public.licitaciones
  set estado = 'en_curso'
  where id = p_licitacion_id and estado = 'adjudicada';

  -- 10. Notificar al carpintero
  insert into public.notificaciones (usuario_id, tipo, titulo, mensaje, link)
  values (
    v_carpintero_id,
    'pago',
    'Fondos de materiales liberados',
    'Se liberaron $' || v_monto_60 || ' (60%) para la compra de materiales.',
    '/licitaciones/' || p_licitacion_id
  );

  return jsonb_build_object(
    'ok',      true,
    'code',    'LIBERADO',
    'mensaje', '60% liberado correctamente.',
    'monto',   v_monto_60,
    'carpintero_id', v_carpintero_id
  );

exception
  when others then
    return jsonb_build_object('ok', false, 'code', 'ERROR_INTERNO',
      'mensaje', 'Error interno: ' || sqlerrm);
end;
$$;

-- ============================================================
-- 2. aprobar_etapa
-- ============================================================
-- Propósito:
--   El cliente aprueba una etapa de certificación.
--   Cambia estado a 'aprobada' y libera la fracción proporcional
--   de fondos al carpintero según el total de etapas.
-- ============================================================
create or replace function public.aprobar_etapa(
  p_etapa_id  uuid,
  p_comentario text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_etapa         record;
  v_lic           record;
  v_carpintero_id uuid;
  v_monto_total   numeric(12,2);
  v_total_etapas  int;
  v_fraccion      numeric(12,2);
begin

  -- 1. Cargar etapa
  select * into v_etapa
  from public.etapas_certificacion
  where id = p_etapa_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND',
      'mensaje', 'Etapa no encontrada.');
  end if;

  -- 2. Cargar licitación
  select * into v_lic
  from public.licitaciones
  where id = v_etapa.licitacion_id;

  -- 3. Solo el cliente dueño puede aprobar
  if v_lic.cliente_id <> auth.uid() and not public.es_admin() then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN',
      'mensaje', 'Solo el cliente puede aprobar etapas.');
  end if;

  -- 4. Estado válido de la etapa
  if v_etapa.estado not in ('en_revision', 'disputada') then
    return jsonb_build_object('ok', false, 'code', 'ESTADO_INVALIDO',
      'mensaje', 'La etapa debe estar en_revision o disputada para aprobar.');
  end if;

  -- 5. Marcar etapa como aprobada
  update public.etapas_certificacion
  set estado              = 'aprobada',
      comentario_cliente  = coalesce(p_comentario, comentario_cliente),
      updated_at          = now()
  where id = p_etapa_id;

  -- 6. Calcular fracción de pago
  v_carpintero_id := public._carpintero_adjudicado(v_etapa.licitacion_id);
  v_monto_total   := public._monto_adjudicado(v_etapa.licitacion_id);

  select count(*) into v_total_etapas
  from public.etapas_certificacion
  where licitacion_id = v_etapa.licitacion_id;

  -- El 40% restante se divide entre las etapas
  -- (el 60% ya se liberó para materiales)
  v_fraccion := round((v_monto_total * 0.40) / v_total_etapas, 2);

  -- 7. Registrar pago parcial de etapa
  insert into public.pagos (licitacion_id, tramo, monto, metodo, estado)
  values (
    v_etapa.licitacion_id,
    10 + v_etapa.orden,   -- tramos 11, 12, 13... según etapa
    v_fraccion,
    'transferencia',
    'confirmado'
  );

  -- 8. Acreditar al carpintero
  update public.perfiles
  set saldo_billetera = coalesce(saldo_billetera, 0) + v_fraccion
  where id = v_carpintero_id;

  -- 9. Movimiento
  insert into public.movimientos (perfil_id, tipo, monto, descripcion)
  values (
    v_carpintero_id,
    'credito',
    v_fraccion,
    'Aprobación etapa "' || v_etapa.nombre || '" — licitación ' || v_etapa.licitacion_id
  );

  -- 10. Notificar al carpintero
  insert into public.notificaciones (usuario_id, tipo, titulo, mensaje, link)
  values (
    v_carpintero_id,
    'etapa',
    'Etapa aprobada',
    'El cliente aprobó la etapa "' || v_etapa.nombre || '" y se liberaron $' || v_fraccion || '.',
    '/licitaciones/' || v_etapa.licitacion_id
  );

  return jsonb_build_object(
    'ok',       true,
    'code',     'APROBADA',
    'mensaje',  'Etapa aprobada y fondos liberados.',
    'etapa',    v_etapa.nombre,
    'monto',    v_fraccion
  );

exception
  when others then
    return jsonb_build_object('ok', false, 'code', 'ERROR_INTERNO',
      'mensaje', 'Error interno: ' || sqlerrm);
end;
$$;

-- ============================================================
-- 3. rechazar_etapa
-- ============================================================
-- Propósito:
--   El cliente rechaza una etapa de certificación marcándola
--   como 'disputada'. No mueve fondos. Registra el motivo y
--   notifica al carpintero para que reenvíe evidencia.
-- ============================================================
create or replace function public.rechazar_etapa(
  p_etapa_id uuid,
  p_motivo   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_etapa         record;
  v_lic           record;
  v_carpintero_id uuid;
begin

  -- 1. Cargar etapa
  select * into v_etapa
  from public.etapas_certificacion
  where id = p_etapa_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND',
      'mensaje', 'Etapa no encontrada.');
  end if;

  -- 2. Cargar licitación
  select * into v_lic
  from public.licitaciones
  where id = v_etapa.licitacion_id;

  -- 3. Solo el cliente puede rechazar
  if v_lic.cliente_id <> auth.uid() and not public.es_admin() then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN',
      'mensaje', 'Solo el cliente puede rechazar etapas.');
  end if;

  -- 4. Solo se puede rechazar si está en revisión
  if v_etapa.estado <> 'en_revision' then
    return jsonb_build_object('ok', false, 'code', 'ESTADO_INVALIDO',
      'mensaje', 'Solo se pueden rechazar etapas en estado en_revision.');
  end if;

  if p_motivo is null or trim(p_motivo) = '' then
    return jsonb_build_object('ok', false, 'code', 'MOTIVO_REQUERIDO',
      'mensaje', 'Debés indicar el motivo del rechazo.');
  end if;

  -- 5. Marcar como disputada
  update public.etapas_certificacion
  set estado             = 'disputada',
      comentario_cliente = p_motivo,
      updated_at         = now()
  where id = p_etapa_id;

  -- 6. Notificar al carpintero
  v_carpintero_id := public._carpintero_adjudicado(v_etapa.licitacion_id);

  insert into public.notificaciones (usuario_id, tipo, titulo, mensaje, link)
  values (
    v_carpintero_id,
    'etapa',
    'Etapa disputada — requiere revisión',
    'El cliente rechazó la etapa "' || v_etapa.nombre || '". Motivo: ' || p_motivo,
    '/licitaciones/' || v_etapa.licitacion_id
  );

  return jsonb_build_object(
    'ok',      true,
    'code',    'DISPUTADA',
    'mensaje', 'Etapa marcada como disputada. El carpintero fue notificado.',
    'etapa',   v_etapa.nombre,
    'motivo',  p_motivo
  );

exception
  when others then
    return jsonb_build_object('ok', false, 'code', 'ERROR_INTERNO',
      'mensaje', 'Error interno: ' || sqlerrm);
end;
$$;

-- ============================================================
-- 4. finalizar_obra (versión licitaciones)
-- ============================================================
-- Propósito:
--   Cierra una licitación de forma atómica:
--     - Valida que todas las etapas estén aprobadas.
--     - Calcula saldo final (monto - 60% ya liberado - etapas ya pagadas).
--     - Descuenta comisión de plataforma.
--     - Acredita neto al carpintero.
--     - Marca licitación como 'completada'.
--     - Suma puntos de reputación al carpintero.
-- ============================================================
create or replace function public.finalizar_obra(
  p_licitacion_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lic               record;
  v_carpintero_id     uuid;
  v_monto_total       numeric(12,2);
  v_ya_pagado         numeric(12,2);
  v_saldo             numeric(12,2);
  v_comision_pct      numeric(5,2);
  v_comision_min      numeric(12,2);
  v_comision          numeric(12,2);
  v_neto              numeric(12,2);
  v_etapas_pendientes int;
  v_config            record;
begin

  -- 1. Cargar licitación
  select * into v_lic
  from public.licitaciones
  where id = p_licitacion_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND',
      'mensaje', 'Licitación no encontrada.');
  end if;

  -- 2. Verificar ownership: cliente dueño o admin
  if v_lic.cliente_id <> auth.uid() and not public.es_admin() then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN',
      'mensaje', 'Solo el cliente o admin puede finalizar la obra.');
  end if;

  -- 3. Estado válido
  if v_lic.estado = 'completada' then
    return jsonb_build_object('ok', false, 'code', 'YA_COMPLETADA',
      'mensaje', 'Esta obra ya fue finalizada.');
  end if;

  if v_lic.estado not in ('en_curso', 'adjudicada') then
    return jsonb_build_object('ok', false, 'code', 'ESTADO_INVALIDO',
      'mensaje', 'La licitación debe estar en_curso o adjudicada.');
  end if;

  -- 4. Verificar que no haya etapas pendientes ni en_revision
  select count(*) into v_etapas_pendientes
  from public.etapas_certificacion
  where licitacion_id = p_licitacion_id
    and estado in ('pendiente', 'en_revision', 'disputada');

  if v_etapas_pendientes > 0 then
    return jsonb_build_object('ok', false, 'code', 'ETAPAS_PENDIENTES',
      'mensaje', 'Hay ' || v_etapas_pendientes || ' etapa(s) sin aprobar. Aprobá todas antes de finalizar.');
  end if;

  -- 5. Obtener carpintero y monto total
  v_carpintero_id := public._carpintero_adjudicado(p_licitacion_id);
  v_monto_total   := public._monto_adjudicado(p_licitacion_id);

  if v_carpintero_id is null then
    return jsonb_build_object('ok', false, 'code', 'SIN_CARPINTERO',
      'mensaje', 'No se encontró carpintero adjudicado.');
  end if;

  -- 6. Calcular total ya pagado (tramo 2 + tramos de etapas confirmados)
  select coalesce(sum(monto), 0) into v_ya_pagado
  from public.pagos
  where licitacion_id = p_licitacion_id
    and estado = 'confirmado'
    and tramo >= 2;   -- excluimos tramo 1 (anticipo del cliente)

  -- 7. Saldo final = monto_total - ya_pagado
  v_saldo := v_monto_total - v_ya_pagado;

  if v_saldo < 0 then
    v_saldo := 0;   -- nunca negativo por redondeos
  end if;

  -- 8. Calcular comisión de plataforma
  select * into v_config from public.config_plataforma where id = 1;
  v_comision_pct := coalesce(v_config.comision_porcentaje, 5.00);
  v_comision_min := coalesce(v_config.comision_minima, 500.00);

  v_comision := greatest(
    round(v_monto_total * v_comision_pct / 100, 2),
    v_comision_min
  );

  v_neto := v_saldo - v_comision;

  -- 9. Registrar pago de saldo final (tramo 3)
  if v_saldo > 0 then
    insert into public.pagos (licitacion_id, tramo, monto, metodo, estado)
    values (p_licitacion_id, 3, v_saldo, 'transferencia', 'confirmado');
  end if;

  -- 10. Movimiento: crédito neto al carpintero
  if v_neto > 0 then
    update public.perfiles
    set saldo_billetera = coalesce(saldo_billetera, 0) + v_neto
    where id = v_carpintero_id;

    insert into public.movimientos (perfil_id, tipo, monto, descripcion)
    values (
      v_carpintero_id,
      'credito',
      v_neto,
      'Saldo final — licitación ' || p_licitacion_id
    );
  end if;

  -- 11. Movimiento: comisión
  if v_comision > 0 then
    insert into public.movimientos (perfil_id, tipo, monto, descripcion)
    values (
      v_carpintero_id,
      'comision',
      v_comision,
      'Comisión plataforma ' || v_comision_pct || '% — licitación ' || p_licitacion_id
    );
  end if;

  -- 12. Marcar licitación como completada
  update public.licitaciones
  set estado     = 'completada',
      updated_at = now()
  where id = p_licitacion_id;

  -- 13. Sumar puntos de reputación al carpintero (100 puntos por obra)
  update public.perfiles
  set puntos = coalesce(puntos, 0) + 100
  where id = v_carpintero_id;

  -- 14. Notificar a ambas partes
  insert into public.notificaciones (usuario_id, tipo, titulo, mensaje, link) values
  (
    v_carpintero_id,
    'pago',
    'Obra finalizada — pago acreditado',
    'La obra fue finalizada. Se acreditaron $' || coalesce(v_neto, 0) || ' en tu billetera.',
    '/licitaciones/' || p_licitacion_id
  ),
  (
    v_lic.cliente_id,
    'sistema',
    'Obra finalizada exitosamente',
    'La licitación fue completada. ¡Gracias por usar CJ Expertos!',
    '/licitaciones/' || p_licitacion_id
  );

  return jsonb_build_object(
    'ok',             true,
    'code',           'COMPLETADA',
    'mensaje',        'Obra finalizada correctamente.',
    'monto_total',    v_monto_total,
    'ya_pagado',      v_ya_pagado,
    'saldo_final',    v_saldo,
    'comision',       v_comision,
    'neto',           v_neto,
    'carpintero_id',  v_carpintero_id
  );

exception
  when others then
    return jsonb_build_object('ok', false, 'code', 'ERROR_INTERNO',
      'mensaje', 'Error interno: ' || sqlerrm);
end;
$$;

-- ============================================================
-- PERMISOS
-- ============================================================
grant execute on function public._carpintero_adjudicado(uuid)    to authenticated;
grant execute on function public._monto_adjudicado(uuid)          to authenticated;
grant execute on function public.liberar_60_porciento(uuid)       to authenticated;
grant execute on function public.aprobar_etapa(uuid, text)        to authenticated;
grant execute on function public.rechazar_etapa(uuid, text)       to authenticated;
grant execute on function public.finalizar_obra(uuid)             to authenticated;

-- ============================================================
-- VERIFICACIÓN MANUAL (reemplazá los UUIDs con valores reales)
-- ============================================================
-- select public.liberar_60_porciento('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
-- select public.aprobar_etapa('cccccccc-0000-0000-0000-000000000001'::uuid, 'Todo correcto');
-- select public.rechazar_etapa('cccccccc-0000-0000-0000-000000000002'::uuid, 'Falta foto del detalle de soldadura');
-- select public.finalizar_obra('aaaaaaaa-0000-0000-0000-000000000002'::uuid);
