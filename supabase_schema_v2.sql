-- =============================================
-- CJ EXPERTOS — Schema completo v2
-- Ejecutar en: Supabase → SQL Editor → New query
-- =============================================

-- ============================================================
-- HELPERS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. PERFILES
-- ============================================================
create table if not exists public.perfiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  nombre            text not null,
  empresa           text,
  email             text,
  telefono          text,
  ciudad            text,
  provincia         text,
  rol               text not null default 'carpintero',
  -- 'carpintero' | 'cliente' | 'admin' | 'proveedor'
  rango             text not null default 'estrella_1',
  -- estrella_1..5 | zafiro | rubi | esmeralda | diamante
  puntos            int  not null default 0,
  saldo_billetera   numeric(12,2) not null default 0,
  avatar_url        text,
  -- Campos ampliados para carpinteros
  bio               text,
  m2_taller         numeric(8,2),
  empleados         int default 0,
  experiencia       int default 0,           -- años de experiencia
  verificado        boolean not null default false,
  activo            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists perfiles_updated_at on public.perfiles;
create trigger perfiles_updated_at before update on public.perfiles
  for each row execute function public.set_updated_at();

-- Helper: devuelve true si el usuario autenticado es admin
create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'rol', 'cliente')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. OBRAS (tabla legada, mantenida para compatibilidad)
-- ============================================================
create table if not exists public.obras (
  id                    uuid primary key default gen_random_uuid(),
  carpintero_id         uuid not null references public.perfiles(id) on delete cascade,
  titulo                text not null,
  descripcion           text,
  cliente_nombre        text,
  cliente_telefono      text,
  cliente_ubicacion     text,
  ancho_mm              int,
  alto_mm               int,
  monto_presupuestado   numeric(12,2) default 0,
  monto_acopiado        numeric(12,2) default 0,
  costo_aluminio        numeric(12,2) default 0,
  costo_vidrio          numeric(12,2) default 0,
  costo_accesorios      numeric(12,2) default 0,
  estado                text not null default 'borrador',
  -- borrador | cotizacion | acopio | fabricacion | entrega | colocacion | finalizada | cancelada
  foto_url              text,
  comision_pct          numeric(5,2) default 5,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists obras_updated_at on public.obras;
create trigger obras_updated_at before update on public.obras
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. MOVIMIENTOS DE BILLETERA
-- ============================================================
create table if not exists public.movimientos (
  id            uuid primary key default gen_random_uuid(),
  perfil_id     uuid not null references public.perfiles(id) on delete cascade,
  obra_id       uuid references public.obras(id) on delete set null,
  tipo          text not null,   -- 'credito' | 'debito' | 'comision'
  monto         numeric(12,2) not null,
  descripcion   text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 4. FOTOS DE OBRA
-- ============================================================
create table if not exists public.fotos_obra (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.obras(id) on delete cascade,
  url         text not null,
  etapa       text,   -- 'medicion' | 'fabricacion' | 'entrega' | 'colocacion'
  nota        text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 5. LICITACIONES
-- ============================================================
create table if not exists public.licitaciones (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid not null references public.perfiles(id) on delete cascade,
  titulo          text not null,
  descripcion     text,
  tipo_servicio   text,
  -- 'ventana' | 'puerta' | 'fachada' | 'cerramiento' | 'otro'
  plano_url       text,
  estado          text not null default 'abierta',
  -- abierta | adjudicada | en_curso | completada | vencida | cancelada
  vence_en        timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists licitaciones_updated_at on public.licitaciones;
create trigger licitaciones_updated_at before update on public.licitaciones
  for each row execute function public.set_updated_at();

create index if not exists idx_licitaciones_cliente on public.licitaciones(cliente_id);
create index if not exists idx_licitaciones_estado  on public.licitaciones(estado);
create index if not exists idx_licitaciones_vence   on public.licitaciones(vence_en);

-- ============================================================
-- 6. COTIZACIONES
-- ============================================================
create table if not exists public.cotizaciones (
  id              uuid primary key default gen_random_uuid(),
  licitacion_id   uuid not null references public.licitaciones(id) on delete cascade,
  carpintero_id   uuid not null references public.perfiles(id) on delete cascade,
  monto           numeric(12,2) not null,
  detalle         text,
  created_at      timestamptz not null default now(),
  unique (licitacion_id, carpintero_id)   -- un carpintero solo cotiza una vez por licitación
);

create index if not exists idx_cotizaciones_licitacion  on public.cotizaciones(licitacion_id);
create index if not exists idx_cotizaciones_carpintero  on public.cotizaciones(carpintero_id);

-- ============================================================
-- 7. ETAPAS DE CERTIFICACIÓN
-- ============================================================
create table if not exists public.etapas_certificacion (
  id                    uuid primary key default gen_random_uuid(),
  licitacion_id         uuid not null references public.licitaciones(id) on delete cascade,
  nombre                text not null,
  orden                 int  not null,
  estado                text not null default 'pendiente',
  -- pendiente | en_revision | aprobada | disputada
  foto_url              text,
  comentario_carpintero text,
  comentario_cliente    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists etapas_updated_at on public.etapas_certificacion;
create trigger etapas_updated_at before update on public.etapas_certificacion
  for each row execute function public.set_updated_at();

create index if not exists idx_etapas_licitacion on public.etapas_certificacion(licitacion_id);

-- ============================================================
-- 8. PAGOS
-- ============================================================
create table if not exists public.pagos (
  id              uuid primary key default gen_random_uuid(),
  licitacion_id   uuid not null references public.licitaciones(id) on delete cascade,
  tramo           int  not null,   -- 1=anticipo, 2=liberación 60%, 3=saldo final
  monto           numeric(12,2) not null,
  metodo          text,            -- 'tarjeta' | 'transferencia'
  comprobante_url text,
  estado          text not null default 'pendiente',
  -- pendiente | confirmado | rechazado
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists pagos_updated_at on public.pagos;
create trigger pagos_updated_at before update on public.pagos
  for each row execute function public.set_updated_at();

create index if not exists idx_pagos_licitacion on public.pagos(licitacion_id);

-- ============================================================
-- 9. CONTRATO / FIRMA DIGITAL
-- ============================================================
create table if not exists public.contrato_firma (
  id                uuid primary key default gen_random_uuid(),
  licitacion_id     uuid not null references public.licitaciones(id) on delete cascade,
  firmante_id       uuid not null references public.perfiles(id) on delete cascade,
  nombre_completo   text not null,
  dni               text,
  acepta_terminos   boolean not null default false,
  firma_imagen_url  text,
  firmado_en        timestamptz,
  created_at        timestamptz not null default now(),
  unique (licitacion_id, firmante_id)
);

create index if not exists idx_contrato_licitacion on public.contrato_firma(licitacion_id);

-- ============================================================
-- 10. SOLICITUDES DE MATERIALES
-- ============================================================
create table if not exists public.solicitudes_materiales (
  id              uuid primary key default gen_random_uuid(),
  carpintero_id   uuid not null references public.perfiles(id) on delete cascade,
  proveedor_id    uuid references public.perfiles(id) on delete set null,
  licitacion_id   uuid references public.licitaciones(id) on delete set null,
  estado          text not null default 'borrador',
  -- borrador | enviada | cotizada | aprobada | entregada | cancelada
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists solicitudes_updated_at on public.solicitudes_materiales;
create trigger solicitudes_updated_at before update on public.solicitudes_materiales
  for each row execute function public.set_updated_at();

create index if not exists idx_solicitudes_carpintero  on public.solicitudes_materiales(carpintero_id);
create index if not exists idx_solicitudes_proveedor   on public.solicitudes_materiales(proveedor_id);

-- ============================================================
-- 11. ITEMS DE SOLICITUD
-- ============================================================
create table if not exists public.items_solicitud (
  id              uuid primary key default gen_random_uuid(),
  solicitud_id    uuid not null references public.solicitudes_materiales(id) on delete cascade,
  descripcion     text not null,
  cantidad        numeric(10,3) not null default 1,
  precio_unitario numeric(12,2),   -- lo completa el proveedor
  created_at      timestamptz not null default now()
);

create index if not exists idx_items_solicitud on public.items_solicitud(solicitud_id);

-- ============================================================
-- 12. CITAS / VISITAS
-- ============================================================
create table if not exists public.citas (
  id              uuid primary key default gen_random_uuid(),
  licitacion_id   uuid not null references public.licitaciones(id) on delete cascade,
  carpintero_id   uuid not null references public.perfiles(id) on delete cascade,
  cliente_id      uuid not null references public.perfiles(id) on delete cascade,
  fecha_propuesta timestamptz not null,
  estado          text not null default 'propuesta',
  -- propuesta | confirmada | rechazada | completada
  notas           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists citas_updated_at on public.citas;
create trigger citas_updated_at before update on public.citas
  for each row execute function public.set_updated_at();

create index if not exists idx_citas_licitacion  on public.citas(licitacion_id);
create index if not exists idx_citas_carpintero  on public.citas(carpintero_id);
create index if not exists idx_citas_cliente     on public.citas(cliente_id);

-- ============================================================
-- 13. NOTIFICACIONES
-- ============================================================
create table if not exists public.notificaciones (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.perfiles(id) on delete cascade,
  tipo        text not null,   -- 'cotizacion' | 'mensaje' | 'pago' | 'etapa' | 'sistema'
  titulo      text not null,
  mensaje     text,
  leida       boolean not null default false,
  link        text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notif_usuario on public.notificaciones(usuario_id);
create index if not exists idx_notif_leida   on public.notificaciones(usuario_id, leida);

-- ============================================================
-- 14. MENSAJES (chat por licitación)
-- ============================================================
create table if not exists public.mensajes (
  id              uuid primary key default gen_random_uuid(),
  licitacion_id   uuid not null references public.licitaciones(id) on delete cascade,
  autor_id        uuid not null references public.perfiles(id) on delete cascade,
  contenido       text not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_mensajes_licitacion on public.mensajes(licitacion_id);
create index if not exists idx_mensajes_autor      on public.mensajes(autor_id);

-- ============================================================
-- 15. CONFIGURACIÓN DE PLATAFORMA (singleton)
-- ============================================================
create table if not exists public.config_plataforma (
  id                  int primary key default 1,
  comision_porcentaje numeric(5,2) not null default 5.00,
  comision_minima     numeric(12,2) not null default 500.00,
  updated_at          timestamptz not null default now(),
  constraint config_singleton check (id = 1)
);

insert into public.config_plataforma (id, comision_porcentaje, comision_minima)
values (1, 5.00, 500.00)
on conflict (id) do nothing;

-- ============================================================
-- 16. PUSH SUBSCRIPTIONS
-- ============================================================
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.perfiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_push_usuario on public.push_subscriptions(usuario_id);

-- ============================================================
-- 17. CARPINTERO — PROVEEDORES PREFERIDOS
-- ============================================================
create table if not exists public.carpintero_proveedores (
  carpintero_id    uuid not null references public.perfiles(id) on delete cascade,
  proveedor_nombre text not null,
  created_at       timestamptz not null default now(),
  primary key (carpintero_id, proveedor_nombre)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.perfiles              enable row level security;
alter table public.obras                 enable row level security;
alter table public.movimientos           enable row level security;
alter table public.fotos_obra            enable row level security;
alter table public.licitaciones          enable row level security;
alter table public.cotizaciones          enable row level security;
alter table public.etapas_certificacion  enable row level security;
alter table public.pagos                 enable row level security;
alter table public.contrato_firma        enable row level security;
alter table public.solicitudes_materiales enable row level security;
alter table public.items_solicitud       enable row level security;
alter table public.citas                 enable row level security;
alter table public.notificaciones        enable row level security;
alter table public.mensajes              enable row level security;
alter table public.config_plataforma     enable row level security;
alter table public.push_subscriptions    enable row level security;
alter table public.carpintero_proveedores enable row level security;

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: perfiles
-- ────────────────────────────────────────────────────────────
-- Cada usuario lee y edita su propio perfil
create policy "perfil_select_own" on public.perfiles
  for select using (auth.uid() = id);

-- Cualquier usuario autenticado puede ver carpinteros activos (directorio)
create policy "perfil_select_carpinteros" on public.perfiles
  for select using (
    activo = true
    and rol in ('carpintero', 'proveedor')
  );

create policy "perfil_update_own" on public.perfiles
  for update using (auth.uid() = id);

-- Admin ve todos
create policy "perfil_admin_all" on public.perfiles
  for all using (public.es_admin());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: obras
-- ────────────────────────────────────────────────────────────
create policy "obras_select" on public.obras
  for select using (auth.uid() = carpintero_id or public.es_admin());

create policy "obras_insert" on public.obras
  for insert with check (auth.uid() = carpintero_id);

create policy "obras_update" on public.obras
  for update using (auth.uid() = carpintero_id or public.es_admin());

create policy "obras_delete" on public.obras
  for delete using (auth.uid() = carpintero_id or public.es_admin());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: movimientos
-- ────────────────────────────────────────────────────────────
create policy "mov_select" on public.movimientos
  for select using (auth.uid() = perfil_id or public.es_admin());

create policy "mov_insert" on public.movimientos
  for insert with check (auth.uid() = perfil_id or public.es_admin());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: fotos_obra
-- ────────────────────────────────────────────────────────────
create policy "fotos_select" on public.fotos_obra
  for select using (
    exists (
      select 1 from public.obras
      where id = fotos_obra.obra_id and carpintero_id = auth.uid()
    )
    or public.es_admin()
  );

create policy "fotos_insert" on public.fotos_obra
  for insert with check (
    exists (
      select 1 from public.obras
      where id = fotos_obra.obra_id and carpintero_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: licitaciones
-- ────────────────────────────────────────────────────────────
-- Cliente dueño ve y gestiona sus licitaciones
create policy "lic_cliente_select" on public.licitaciones
  for select using (auth.uid() = cliente_id or public.es_admin());

create policy "lic_cliente_insert" on public.licitaciones
  for insert with check (auth.uid() = cliente_id);

create policy "lic_cliente_update" on public.licitaciones
  for update using (auth.uid() = cliente_id or public.es_admin());

-- Carpinteros pueden ver licitaciones abiertas (para cotizar)
create policy "lic_carpintero_abiertas" on public.licitaciones
  for select using (
    estado = 'abierta'
    and exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'carpintero' and activo = true
    )
  );

-- Carpintero que cotizó puede seguir viendo la licitación
create policy "lic_carpintero_cotizado" on public.licitaciones
  for select using (
    exists (
      select 1 from public.cotizaciones
      where licitacion_id = licitaciones.id and carpintero_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: cotizaciones
-- ────────────────────────────────────────────────────────────
-- Carpintero ve y crea las suyas
create policy "cot_carpintero_select" on public.cotizaciones
  for select using (auth.uid() = carpintero_id or public.es_admin());

create policy "cot_carpintero_insert" on public.cotizaciones
  for insert with check (
    auth.uid() = carpintero_id
    and exists (
      select 1 from public.licitaciones
      where id = licitacion_id and estado = 'abierta'
    )
  );

create policy "cot_carpintero_update" on public.cotizaciones
  for update using (auth.uid() = carpintero_id);

-- Cliente dueño de la licitación puede ver las cotizaciones
create policy "cot_cliente_select" on public.cotizaciones
  for select using (
    exists (
      select 1 from public.licitaciones
      where id = cotizaciones.licitacion_id and cliente_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: etapas_certificacion
-- ────────────────────────────────────────────────────────────
create policy "etapas_participantes" on public.etapas_certificacion
  for select using (
    public.es_admin()
    or exists (
      select 1 from public.licitaciones l
      where l.id = etapas_certificacion.licitacion_id
        and (l.cliente_id = auth.uid()
             or exists (
               select 1 from public.cotizaciones c
               where c.licitacion_id = l.id and c.carpintero_id = auth.uid()
             )
        )
    )
  );

create policy "etapas_carpintero_insert" on public.etapas_certificacion
  for insert with check (
    exists (
      select 1 from public.cotizaciones c
      join public.licitaciones l on l.id = c.licitacion_id
      where c.licitacion_id = etapas_certificacion.licitacion_id
        and c.carpintero_id = auth.uid()
        and l.estado in ('adjudicada', 'en_curso')
    )
  );

create policy "etapas_update_participantes" on public.etapas_certificacion
  for update using (
    public.es_admin()
    or exists (
      select 1 from public.licitaciones l
      where l.id = etapas_certificacion.licitacion_id
        and (l.cliente_id = auth.uid()
             or exists (
               select 1 from public.cotizaciones c
               where c.licitacion_id = l.id and c.carpintero_id = auth.uid()
             )
        )
    )
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: pagos
-- ────────────────────────────────────────────────────────────
create policy "pagos_select" on public.pagos
  for select using (
    public.es_admin()
    or exists (
      select 1 from public.licitaciones l
      where l.id = pagos.licitacion_id and l.cliente_id = auth.uid()
    )
    or exists (
      select 1 from public.cotizaciones c
      where c.licitacion_id = pagos.licitacion_id and c.carpintero_id = auth.uid()
    )
  );

create policy "pagos_insert_cliente" on public.pagos
  for insert with check (
    exists (
      select 1 from public.licitaciones l
      where l.id = licitacion_id and l.cliente_id = auth.uid()
    )
  );

create policy "pagos_update_admin" on public.pagos
  for update using (public.es_admin());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: contrato_firma
-- ────────────────────────────────────────────────────────────
create policy "contrato_participantes" on public.contrato_firma
  for select using (
    auth.uid() = firmante_id
    or public.es_admin()
    or exists (
      select 1 from public.licitaciones l
      where l.id = contrato_firma.licitacion_id
        and (l.cliente_id = auth.uid()
             or exists (
               select 1 from public.cotizaciones c
               where c.licitacion_id = l.id and c.carpintero_id = auth.uid()
             )
        )
    )
  );

create policy "contrato_insert_own" on public.contrato_firma
  for insert with check (auth.uid() = firmante_id);

create policy "contrato_update_own" on public.contrato_firma
  for update using (auth.uid() = firmante_id);

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: solicitudes_materiales
-- ────────────────────────────────────────────────────────────
create policy "solicitudes_carpintero" on public.solicitudes_materiales
  for select using (
    auth.uid() = carpintero_id
    or auth.uid() = proveedor_id
    or public.es_admin()
  );

create policy "solicitudes_insert" on public.solicitudes_materiales
  for insert with check (auth.uid() = carpintero_id);

create policy "solicitudes_update" on public.solicitudes_materiales
  for update using (
    auth.uid() = carpintero_id
    or auth.uid() = proveedor_id
    or public.es_admin()
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: items_solicitud
-- ────────────────────────────────────────────────────────────
create policy "items_select" on public.items_solicitud
  for select using (
    public.es_admin()
    or exists (
      select 1 from public.solicitudes_materiales s
      where s.id = items_solicitud.solicitud_id
        and (s.carpintero_id = auth.uid() or s.proveedor_id = auth.uid())
    )
  );

create policy "items_insert" on public.items_solicitud
  for insert with check (
    exists (
      select 1 from public.solicitudes_materiales s
      where s.id = solicitud_id and s.carpintero_id = auth.uid()
    )
  );

create policy "items_update_proveedor" on public.items_solicitud
  for update using (
    public.es_admin()
    or exists (
      select 1 from public.solicitudes_materiales s
      where s.id = items_solicitud.solicitud_id
        and (s.carpintero_id = auth.uid() or s.proveedor_id = auth.uid())
    )
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: citas
-- ────────────────────────────────────────────────────────────
create policy "citas_participantes" on public.citas
  for select using (
    auth.uid() in (carpintero_id, cliente_id)
    or public.es_admin()
  );

create policy "citas_insert" on public.citas
  for insert with check (
    auth.uid() in (carpintero_id, cliente_id)
  );

create policy "citas_update" on public.citas
  for update using (
    auth.uid() in (carpintero_id, cliente_id)
    or public.es_admin()
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: notificaciones
-- ────────────────────────────────────────────────────────────
create policy "notif_destinatario" on public.notificaciones
  for select using (auth.uid() = usuario_id);

create policy "notif_update_own" on public.notificaciones
  for update using (auth.uid() = usuario_id);

create policy "notif_insert_system" on public.notificaciones
  for insert with check (
    -- el usuario se crea a sí mismo (notificaciones propias) o admin/sistema
    auth.uid() = usuario_id or public.es_admin()
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: mensajes
-- ────────────────────────────────────────────────────────────
create policy "mensajes_participantes" on public.mensajes
  for select using (
    public.es_admin()
    or exists (
      select 1 from public.licitaciones l
      where l.id = mensajes.licitacion_id
        and (l.cliente_id = auth.uid()
             or exists (
               select 1 from public.cotizaciones c
               where c.licitacion_id = l.id and c.carpintero_id = auth.uid()
             )
        )
    )
  );

create policy "mensajes_insert_participantes" on public.mensajes
  for insert with check (
    auth.uid() = autor_id
    and exists (
      select 1 from public.licitaciones l
      where l.id = licitacion_id
        and (l.cliente_id = auth.uid()
             or exists (
               select 1 from public.cotizaciones c
               where c.licitacion_id = l.id and c.carpintero_id = auth.uid()
             )
        )
    )
  );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: config_plataforma
-- ────────────────────────────────────────────────────────────
create policy "config_read_all" on public.config_plataforma
  for select using (auth.role() = 'authenticated');

create policy "config_admin_write" on public.config_plataforma
  for all using (public.es_admin());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: push_subscriptions
-- ────────────────────────────────────────────────────────────
create policy "push_own" on public.push_subscriptions
  for select using (auth.uid() = usuario_id);

create policy "push_insert" on public.push_subscriptions
  for insert with check (auth.uid() = usuario_id);

create policy "push_delete" on public.push_subscriptions
  for delete using (auth.uid() = usuario_id);

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS: carpintero_proveedores
-- ────────────────────────────────────────────────────────────
create policy "carp_prov_own" on public.carpintero_proveedores
  for select using (auth.uid() = carpintero_id or public.es_admin());

create policy "carp_prov_insert" on public.carpintero_proveedores
  for insert with check (auth.uid() = carpintero_id);

create policy "carp_prov_delete" on public.carpintero_proveedores
  for delete using (auth.uid() = carpintero_id or public.es_admin());

-- ============================================================
-- STORAGE BUCKETS (ejecutar luego en Storage UI o SQL)
-- ============================================================
-- insert into storage.buckets (id, name, public) values
--   ('planos',         'planos',         false),
--   ('fotos-obra',     'fotos-obra',     false),
--   ('comprobantes',   'comprobantes',   false),
--   ('firmas',         'firmas',         false),
--   ('fotos-etapas',   'fotos-etapas',   false);
