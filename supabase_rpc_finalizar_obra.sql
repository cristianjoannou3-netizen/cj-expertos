-- ============================================================
-- CJ EXPERTOS — RPC: finalizar_obra
-- Ejecutar en: Supabase → SQL Editor → New query
-- ============================================================
-- Propósito: finalizar una obra de forma atómica y segura.
--   - Valida ownership, datos y estado previo.
--   - Calcula sobrante, comisión y neto.
--   - Inserta movimientos en una sola transacción.
--   - Actualiza saldo_billetera del carpintero.
--   - Marca la obra como 'finalizada'.
--   - Si la obra ya fue liquidada, retorna error explícito.
-- ============================================================

create or replace function public.finalizar_obra(
  p_obra_id   uuid,
  p_user_id   uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_obra          record;
  v_costos        numeric(12,2);
  v_sobrante      numeric(12,2);
  v_comision_pct  numeric(5,2);
  v_comision      numeric(12,2);
  v_neto          numeric(12,2);
  v_ya_liquidada  boolean;
begin

  -- 1. Cargar obra y validar ownership
  select * into v_obra
  from public.obras
  where id = p_obra_id
    and carpintero_id = p_user_id;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_FOUND',
      'mensaje', 'Obra no encontrada o no te pertenece.'
    );
  end if;

  -- 2. Verificar que no esté ya finalizada
  if v_obra.estado = 'finalizada' then
    return jsonb_build_object(
      'ok', false,
      'code', 'YA_FINALIZADA',
      'mensaje', 'Esta obra ya fue finalizada anteriormente.'
    );
  end if;

  -- 3. Verificar que no existan movimientos de cierre previos
  --    (protección contra doble-click o llamada duplicada)
  select exists(
    select 1 from public.movimientos
    where obra_id = p_obra_id
      and perfil_id = p_user_id
      and tipo in ('credito', 'debito', 'comision')
  ) into v_ya_liquidada;

  if v_ya_liquidada then
    return jsonb_build_object(
      'ok', false,
      'code', 'YA_LIQUIDADA',
      'mensaje', 'Esta obra ya tiene movimientos registrados. No se puede liquidar dos veces.'
    );
  end if;

  -- 4. Validar que tenga acopio cargado
  if v_obra.monto_acopiado is null or v_obra.monto_acopiado = 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'FALTA_ACOPIO',
      'mensaje', 'Cargá el monto de acopio cobrado al cliente antes de finalizar.'
    );
  end if;

  -- 5. Calcular costos totales
  v_costos := coalesce(v_obra.costo_aluminio, 0)
            + coalesce(v_obra.costo_vidrio, 0)
            + coalesce(v_obra.costo_accesorios, 0);

  if v_costos = 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'FALTA_COSTOS',
      'mensaje', 'Cargá los costos de materiales (aluminio, vidrio, accesorios) antes de finalizar.'
    );
  end if;

  -- 6. Calcular sobrante y comisión
  v_sobrante     := v_obra.monto_acopiado - v_costos;
  v_comision_pct := coalesce(v_obra.comision_pct, 5);
  v_comision     := case when v_sobrante > 0
                         then round(v_sobrante * v_comision_pct / 100, 2)
                         else 0 end;
  v_neto         := v_sobrante - v_comision;

  -- 7. Insertar movimiento principal (crédito o débito)
  if v_sobrante > 0 then
    insert into public.movimientos (perfil_id, obra_id, tipo, monto, descripcion)
    values (p_user_id, p_obra_id, 'credito', v_sobrante,
            'Sobrante — ' || v_obra.titulo);
  elsif v_sobrante < 0 then
    insert into public.movimientos (perfil_id, obra_id, tipo, monto, descripcion)
    values (p_user_id, p_obra_id, 'debito', abs(v_sobrante),
            'Déficit — ' || v_obra.titulo);
  end if;

  -- 8. Insertar movimiento de comisión (solo si hay sobrante > 0)
  if v_comision > 0 then
    insert into public.movimientos (perfil_id, obra_id, tipo, monto, descripcion)
    values (p_user_id, p_obra_id, 'comision', v_comision,
            'Comisión ' || v_comision_pct || '% — ' || v_obra.titulo);
  end if;

  -- 9. Actualizar saldo_billetera (suma el neto — puede ser negativo)
  update public.perfiles
  set saldo_billetera = coalesce(saldo_billetera, 0) + v_neto
  where id = p_user_id;

  -- 10. Marcar la obra como finalizada
  update public.obras
  set estado = 'finalizada'
  where id = p_obra_id;

  -- 11. Retornar resultado exitoso
  return jsonb_build_object(
    'ok',          true,
    'code',        'FINALIZADA',
    'mensaje',     'Obra finalizada correctamente.',
    'sobrante',    v_sobrante,
    'comision',    v_comision,
    'neto',        v_neto,
    'titulo',      v_obra.titulo
  );

exception
  when others then
    return jsonb_build_object(
      'ok',     false,
      'code',   'ERROR_INTERNO',
      'mensaje', 'Error interno: ' || sqlerrm
    );
end;
$$;

-- Permitir que usuarios autenticados llamen a esta función
grant execute on function public.finalizar_obra(uuid, uuid) to authenticated;

-- ============================================================
-- VERIFICACIÓN MANUAL (reemplazá los UUIDs con valores reales)
-- ============================================================
-- select public.finalizar_obra(
--   'uuid-de-la-obra'::uuid,
--   'uuid-del-carpintero'::uuid
-- );
