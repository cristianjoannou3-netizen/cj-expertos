-- =============================================
-- CJ EXPERTOS — SQL completo para Supabase
-- Ejecutar en: Supabase → SQL Editor → New query
-- =============================================

-- 1. PERFILES (extiende auth.users)
create table if not exists public.perfiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nombre        text not null,
  empresa       text,
  email         text,
  telefono      text,
  ciudad        text,
  provincia     text,
  rol           text not null default 'carpintero',   -- 'carpintero' | 'cliente' | 'admin'
  rango         text not null default 'estrella_1',   -- estrella_1..5, zafiro, rubi, esmeralda, diamante
  puntos        int  not null default 0,
  saldo_billetera numeric(12,2) not null default 0,
  avatar_url    text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. OBRAS
create table if not exists public.obras (
  id            uuid primary key default gen_random_uuid(),
  carpintero_id uuid not null references public.perfiles(id) on delete cascade,
  titulo        text not null,
  descripcion   text,
  -- Cliente
  cliente_nombre    text,
  cliente_telefono  text,
  cliente_ubicacion text,
  -- Medidas principales
  ancho_mm      int,
  alto_mm       int,
  -- Presupuesto
  monto_presupuestado  numeric(12,2) default 0,
  monto_acopiado       numeric(12,2) default 0,  -- lo que pagó el cliente
  costo_aluminio       numeric(12,2) default 0,
  costo_vidrio         numeric(12,2) default 0,
  costo_accesorios     numeric(12,2) default 0,
  -- Estado
  estado        text not null default 'borrador',
  -- borrador | cotizacion | acopio | fabricacion | entrega | colocacion | finalizada | cancelada
  foto_url      text,
  -- Comisión (porcentaje descontado al liberar pago)
  comision_pct  numeric(5,2) default 5,
  -- Timestamps
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger obras_updated_at before update on public.obras
  for each row execute function public.set_updated_at();

-- 3. MOVIMIENTOS DE BILLETERA
create table if not exists public.movimientos (
  id            uuid primary key default gen_random_uuid(),
  perfil_id     uuid not null references public.perfiles(id) on delete cascade,
  obra_id       uuid references public.obras(id),
  tipo          text not null,   -- 'credito' | 'debito' | 'comision' | 'retiro' | 'deposito'
  monto         numeric(12,2) not null,
  descripcion   text,
  created_at    timestamptz not null default now()
);

-- 4. FOTOS DE OBRA
create table if not exists public.fotos_obra (
  id        uuid primary key default gen_random_uuid(),
  obra_id   uuid not null references public.obras(id) on delete cascade,
  url       text not null,
  etapa     text,   -- 'medicion' | 'fabricacion' | 'entrega' | 'colocacion'
  nota      text,
  created_at timestamptz not null default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.perfiles enable row level security;
alter table public.obras enable row level security;
alter table public.movimientos enable row level security;
alter table public.fotos_obra enable row level security;

-- Perfiles: cada usuario ve su propio perfil; admin ve todos
create policy "perfil_select" on public.perfiles for select using (auth.uid() = id);
create policy "perfil_update" on public.perfiles for update using (auth.uid() = id);

-- Obras: carpintero ve sus obras
create policy "obras_select" on public.obras for select using (auth.uid() = carpintero_id);
create policy "obras_insert" on public.obras for insert with check (auth.uid() = carpintero_id);
create policy "obras_update" on public.obras for update using (auth.uid() = carpintero_id);
create policy "obras_delete" on public.obras for delete using (auth.uid() = carpintero_id);

-- Movimientos: el dueño ve los suyos y puede insertar los propios
create policy "mov_select" on public.movimientos for select using (auth.uid() = perfil_id);
create policy "mov_insert" on public.movimientos for insert with check (auth.uid() = perfil_id);

-- Fotos: el dueño de la obra
create policy "fotos_select" on public.fotos_obra for select using (
  exists (select 1 from public.obras where id = fotos_obra.obra_id and carpintero_id = auth.uid())
);
create policy "fotos_insert" on public.fotos_obra for insert with check (
  exists (select 1 from public.obras where id = fotos_obra.obra_id and carpintero_id = auth.uid())
);

-- =============================================
-- RPC: finalizar_obra (atómica)
-- Calcula sobrante, aplica comisión, acredita saldo billetera,
-- registra movimiento y actualiza estado a 'finalizada'.
-- Retorna JSON con resultado.
-- =============================================
create or replace function public.finalizar_obra(
  p_obra_id  uuid,
  p_user_id  uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_obra          public.obras%rowtype;
  v_costos        numeric(12,2);
  v_sobrante      numeric(12,2);
  v_comision_monto numeric(12,2);
  v_neto          numeric(12,2);
  v_ya_liquidada  boolean;
begin
  -- 1. Cargar obra y validar permisos
  select * into v_obra
  from public.obras
  where id = p_obra_id and carpintero_id = p_user_id
  for update;

  if not found then
    return json_build_object('ok', false, 'code', 'NOT_FOUND',
      'mensaje', 'Obra no encontrada o sin permisos.');
  end if;

  -- 2. Validar que no esté ya finalizada
  if v_obra.estado = 'finalizada' then
    return json_build_object('ok', false, 'code', 'YA_FINALIZADA',
      'mensaje', 'Esta obra ya fue finalizada anteriormente.');
  end if;

  -- 3. Validar que no tenga movimientos ya generados (doble liquidación)
  select exists(
    select 1 from public.movimientos
    where obra_id = p_obra_id and tipo in ('credito', 'comision')
  ) into v_ya_liquidada;

  if v_ya_liquidada then
    return json_build_object('ok', false, 'code', 'YA_LIQUIDADA',
      'mensaje', 'Esta obra ya tiene movimientos registrados. No se puede liquidar dos veces.');
  end if;

  -- 4. Validar que haya acopio cargado
  if coalesce(v_obra.monto_acopiado, 0) <= 0 then
    return json_build_object('ok', false, 'code', 'FALTA_ACOPIO',
      'mensaje', 'Cargá el monto de acopio cobrado al cliente antes de finalizar.');
  end if;

  -- 5. Validar que haya costos cargados
  v_costos := coalesce(v_obra.costo_aluminio, 0)
            + coalesce(v_obra.costo_vidrio, 0)
            + coalesce(v_obra.costo_accesorios, 0);

  if v_costos <= 0 then
    return json_build_object('ok', false, 'code', 'FALTA_COSTOS',
      'mensaje', 'Cargá los costos de materiales antes de finalizar.');
  end if;

  -- 6. Calcular sobrante, comisión y neto
  v_sobrante       := v_obra.monto_acopiado - v_costos;
  v_comision_monto := round(v_sobrante * coalesce(v_obra.comision_pct, 5) / 100.0, 2);
  -- Sólo aplicar comisión si hay sobrante positivo
  if v_sobrante <= 0 then
    v_comision_monto := 0;
  end if;
  v_neto := v_sobrante - v_comision_monto;

  -- 7. Actualizar estado de la obra
  update public.obras
  set estado = 'finalizada', updated_at = now()
  where id = p_obra_id;

  -- 8. Registrar movimiento de sobrante (puede ser negativo = débito)
  if v_sobrante <> 0 then
    insert into public.movimientos (perfil_id, obra_id, tipo, monto, descripcion)
    values (
      p_user_id,
      p_obra_id,
      case when v_sobrante > 0 then 'credito' else 'debito' end,
      abs(v_sobrante),
      'Sobrante obra: ' || v_obra.titulo
    );
  end if;

  -- 9. Registrar comisión si aplica
  if v_comision_monto > 0 then
    insert into public.movimientos (perfil_id, obra_id, tipo, monto, descripcion)
    values (
      p_user_id,
      p_obra_id,
      'comision',
      v_comision_monto,
      'Comisión ' || coalesce(v_obra.comision_pct, 5)::text || '% — ' || v_obra.titulo
    );
  end if;

  -- 10. Actualizar saldo billetera del carpintero
  update public.perfiles
  set saldo_billetera = saldo_billetera + v_neto
  where id = p_user_id;

  -- 11. Actualizar puntos (1 punto por obra finalizada)
  update public.perfiles
  set puntos = puntos + 1
  where id = p_user_id;

  -- 12. Actualizar rango según puntos
  update public.perfiles
  set rango = case
    when puntos >= 100 then 'diamante'
    when puntos >= 50  then 'esmeralda'
    when puntos >= 30  then 'rubi'
    when puntos >= 20  then 'zafiro'
    when puntos >= 10  then 'estrella_5'
    when puntos >= 7   then 'estrella_4'
    when puntos >= 4   then 'estrella_3'
    when puntos >= 2   then 'estrella_2'
    else 'estrella_1'
  end
  where id = p_user_id;

  return json_build_object(
    'ok',       true,
    'code',     'OK',
    'mensaje',  'Obra finalizada correctamente.',
    'sobrante', v_sobrante,
    'comision', v_comision_monto,
    'neto',     v_neto
  );
end;
$$;

-- Permisos: sólo usuarios autenticados pueden ejecutar la RPC
revoke all on function public.finalizar_obra(uuid, uuid) from public;
grant execute on function public.finalizar_obra(uuid, uuid) to authenticated;

-- =============================================
-- STORAGE BUCKET
-- Crear en: Supabase → Storage → New bucket
-- Nombre: fotos-obra  |  Public: true (para URLs públicas)
-- =============================================
-- insert into storage.buckets (id, name, public) values ('fotos-obra', 'fotos-obra', true);
-- create policy "upload_fotos" on storage.objects for insert
--   with check (bucket_id = 'fotos-obra' and auth.role() = 'authenticated');
-- create policy "select_fotos" on storage.objects for select
--   using (bucket_id = 'fotos-obra');
-- create policy "delete_fotos" on storage.objects for delete
--   using (bucket_id = 'fotos-obra' and auth.uid()::text = (storage.foldername(name))[1]);
