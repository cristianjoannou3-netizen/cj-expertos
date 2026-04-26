-- =============================================
-- CJ EXPERTOS — Seed data realista
-- IMPORTANTE: Ejecutar DESPUÉS de supabase_schema_v2.sql
-- Los UUIDs son fijos para consistencia referencial.
-- =============================================

-- ============================================================
-- USUARIOS EN auth.users (simulación — en producción se crean
-- por el flow de registro; aquí los insertamos manualmente)
-- ============================================================

-- Nota: En Supabase real usar el Dashboard → Authentication → Users
-- para crear usuarios con email/password y copiar sus UUIDs aquí.
-- Los UUIDs a continuación son ficticios pero consistentes.

-- admin
-- id: 00000000-0000-0000-0000-000000000001
-- carpinteros: 0000...0011 .. 0015
-- clientes:    0000...0021 .. 0023
-- proveedores: 0000...0031 .. 0032

-- ============================================================
-- PERFILES
-- ============================================================

-- Limpieza previa (útil en re-ejecuciones de dev)
truncate public.carpintero_proveedores,
         public.push_subscriptions,
         public.config_plataforma,
         public.notificaciones,
         public.mensajes,
         public.citas,
         public.items_solicitud,
         public.solicitudes_materiales,
         public.contrato_firma,
         public.pagos,
         public.etapas_certificacion,
         public.cotizaciones,
         public.licitaciones,
         public.fotos_obra,
         public.movimientos,
         public.obras,
         public.perfiles
cascade;

insert into public.perfiles
  (id, nombre, empresa, email, telefono, ciudad, provincia, rol,
   rango, puntos, saldo_billetera, bio, m2_taller, empleados, experiencia,
   verificado, activo)
values

-- ─── ADMIN ────────────────────────────────────────────────────
('00000000-0000-0000-0000-000000000001',
 'Administrador CJ', 'CJ Expertos', 'admin@cjexpertos.com', '+5491100000001',
 'Buenos Aires', 'Buenos Aires', 'admin',
 'diamante', 9999, 0,
 null, null, null, null,
 true, true),

-- ─── CARPINTEROS ──────────────────────────────────────────────
('00000000-0000-0000-0000-000000000011',
 'Carlos Mendez', 'Aluminios Mendez', 'carlos@aluminiosmendez.com', '+5491100000011',
 'Córdoba', 'Córdoba', 'carpintero',
 'diamante', 1240, 85000.00,
 'Especialista en fachadas de aluminio y ventanas DVH con más de 15 años en el rubro.',
 120.00, 6, 15,
 true, true),

('00000000-0000-0000-0000-000000000012',
 'Roberto Silva', 'Silva Cerramientos', 'roberto@silvacerramientos.com', '+5491100000012',
 'Rosario', 'Santa Fe', 'carpintero',
 'esmeralda', 870, 42000.00,
 'Trabajamos en cerramientos residenciales y comerciales. Calidad garantizada.',
 80.00, 4, 10,
 true, true),

('00000000-0000-0000-0000-000000000013',
 'Marcela Torres', 'Torres Aluminio', 'marcela@torresaluminio.com', '+5491100000013',
 'Mendoza', 'Mendoza', 'carpintero',
 'rubi', 520, 18000.00,
 'Cerramientos y puertas de aluminio anodizado y lacado. Atención personalizada.',
 50.00, 3, 7,
 true, true),

('00000000-0000-0000-0000-000000000014',
 'Diego Ferreyra', 'Ferreyra Ventanas', 'diego@ferreyraventanas.com', '+5491100000014',
 'Buenos Aires', 'Buenos Aires', 'carpintero',
 'zafiro', 310, 8500.00,
 'Instalador independiente con foco en CABA y GBA Norte.',
 30.00, 2, 4,
 false, true),

('00000000-0000-0000-0000-000000000015',
 'Ana Gómez', 'Gómez & Asociados', 'ana@gomezasociados.com', '+5491100000015',
 'La Plata', 'Buenos Aires', 'carpintero',
 'estrella_3', 95, 2100.00,
 'Recién iniciada, egresada de la UTN. Especialidad en aberturas de perfil europeo.',
 20.00, 1, 2,
 false, true),

-- ─── CLIENTES ─────────────────────────────────────────────────
('00000000-0000-0000-0000-000000000021',
 'Sebastián Ríos', null, 'sebastian@example.com', '+5491100000021',
 'Buenos Aires', 'Buenos Aires', 'cliente',
 'estrella_1', 0, 0,
 null, null, null, null,
 false, true),

('00000000-0000-0000-0000-000000000022',
 'Valentina Cruz', null, 'valentina@example.com', '+5491100000022',
 'Córdoba', 'Córdoba', 'cliente',
 'estrella_1', 0, 0,
 null, null, null, null,
 false, true),

('00000000-0000-0000-0000-000000000023',
 'Martín Beltrán', 'Constructora Beltrán', 'martin@constructorabeltra.com', '+5491100000023',
 'Rosario', 'Santa Fe', 'cliente',
 'estrella_1', 0, 0,
 null, null, null, null,
 false, true),

-- ─── PROVEEDORES ──────────────────────────────────────────────
('00000000-0000-0000-0000-000000000031',
 'Juan Soto', 'Distribuidora Soto Aluminio', 'ventas@sotosaluminio.com', '+5491100000031',
 'Buenos Aires', 'Buenos Aires', 'proveedor',
 'estrella_1', 0, 0,
 'Distribuidor mayorista de perfiles Aluar y accesorios.',
 null, null, null,
 true, true),

('00000000-0000-0000-0000-000000000032',
 'Lorena Ponce', 'Vidrios Ponce SA', 'pedidos@vidriosp.com', '+5491100000032',
 'Buenos Aires', 'Buenos Aires', 'proveedor',
 'estrella_1', 0, 0,
 'Vidrios simples, doble y triple hermético. Envío a todo el país.',
 null, null, null,
 true, true);

-- ============================================================
-- CONFIG PLATAFORMA
-- ============================================================
insert into public.config_plataforma (id, comision_porcentaje, comision_minima)
values (1, 5.00, 500.00)
on conflict (id) do update
  set comision_porcentaje = excluded.comision_porcentaje,
      comision_minima     = excluded.comision_minima,
      updated_at          = now();

-- ============================================================
-- CARPINTERO — PROVEEDORES PREFERIDOS
-- ============================================================
insert into public.carpintero_proveedores (carpintero_id, proveedor_nombre) values
  ('00000000-0000-0000-0000-000000000011', 'Distribuidora Soto Aluminio'),
  ('00000000-0000-0000-0000-000000000011', 'Vidrios Ponce SA'),
  ('00000000-0000-0000-0000-000000000012', 'Distribuidora Soto Aluminio'),
  ('00000000-0000-0000-0000-000000000013', 'Aluar Distribución'),
  ('00000000-0000-0000-0000-000000000014', 'Vidrios Ponce SA');

-- ============================================================
-- LICITACIONES
-- ============================================================

-- Licitación 1: ABIERTA (cliente Sebastián Ríos)
insert into public.licitaciones
  (id, cliente_id, titulo, descripcion, tipo_servicio, estado, vence_en)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000021',
  'Ventanas DVH para departamento 3 ambientes',
  'Necesito reemplazar 4 ventanas corredizas y 1 puerta balcón en mi departamento en Palermo. Perfil serie 25, DVH 4-12-4, color blanco. Piso 3, acceso con escalera.',
  'ventana',
  'abierta',
  now() + interval '14 days'
);

-- Licitación 2: ADJUDICADA (cliente Valentina Cruz, adjudicada a Mendez)
insert into public.licitaciones
  (id, cliente_id, titulo, descripcion, tipo_servicio, estado, vence_en)
values (
  'aaaaaaaa-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000022',
  'Cerramiento de balcón 8m²',
  'Balcón corrido de 4m de frente. Quiero cerramiento plegable de aluminio con vidrio 4mm para dejar como solario. En Córdoba Capital.',
  'cerramiento',
  'adjudicada',
  now() + interval '60 days'
);

-- ============================================================
-- COTIZACIONES
-- ============================================================

-- Para la licitación abierta (licitación 1) — 3 carpinteros cotizaron
insert into public.cotizaciones (id, licitacion_id, carpintero_id, monto, detalle) values
(
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  385000.00,
  'Incluye: 4 ventanas corredizas 1.20x1.10 + 1 puerta balcón 0.80x2.10, perfil serie 25, DVH 4-12-4, herrajes de primera, garantía 2 años. Instalación incluida.'
),
(
  'bbbbbbbb-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000014',
  310000.00,
  '4 ventanas + 1 balconera. Perfil serie 25 color blanco, vidrio DVH, instalación básica incluida. Sin incluir retiro de aberturas viejas.'
),
(
  'bbbbbbbb-0000-0000-0000-000000000003',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000015',
  275000.00,
  'Presupuesto preliminar sujeto a visita técnica. Material perfil europeo, DVH, herrajes alemanes.'
);

-- Para la licitación adjudicada (licitación 2) — adjudicada a Mendez
insert into public.cotizaciones (id, licitacion_id, carpintero_id, monto, detalle) values
(
  'bbbbbbbb-0000-0000-0000-000000000004',
  'aaaaaaaa-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000011',
  198000.00,
  'Cerramiento plegable 4 hojas, aluminio serie 30, vidrio laminado 4+4, incluye zócalo de aluminio y colocación.'
),
(
  'bbbbbbbb-0000-0000-0000-000000000005',
  'aaaaaaaa-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000012',
  185000.00,
  'Cerramiento plegable aluminio, vidrio float 4mm, herrajes básicos. Colocación incluida.'
);

-- ============================================================
-- ETAPAS DE CERTIFICACIÓN (para licitación 2 adjudicada)
-- ============================================================
insert into public.etapas_certificacion
  (id, licitacion_id, nombre, orden, estado) values
(
  'cccccccc-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'Medición y confirmación de planos', 1, 'aprobada'
),
(
  'cccccccc-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'Fabricación de perfiles y corte', 2, 'en_revision'
),
(
  'cccccccc-0000-0000-0000-000000000003',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'Colocación e instalación', 3, 'pendiente'
),
(
  'cccccccc-0000-0000-0000-000000000004',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'Entrega final y conformidad', 4, 'pendiente'
);

-- Comentario del carpintero en etapa 2
update public.etapas_certificacion
set comentario_carpintero = 'Perfiles cortados y listos. Adjunto foto de fabricación.',
    foto_url = 'https://placehold.co/800x600?text=Fabricacion'
where id = 'cccccccc-0000-0000-0000-000000000002';

-- ============================================================
-- PAGOS (para licitación 2)
-- ============================================================
insert into public.pagos
  (id, licitacion_id, tramo, monto, metodo, estado) values
(
  'dddddddd-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  1,                   -- anticipo 30%
  59400.00,
  'transferencia',
  'confirmado'
),
(
  'dddddddd-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000002',
  2,                   -- liberación 60% materiales
  118800.00,
  'transferencia',
  'pendiente'
);

-- ============================================================
-- CONTRATO FIRMA (licitación 2, ambas partes)
-- ============================================================
insert into public.contrato_firma
  (id, licitacion_id, firmante_id, nombre_completo, dni, acepta_terminos, firmado_en) values
(
  'eeeeeeee-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000022',  -- cliente
  'Valentina Cruz',
  '29.876.543',
  true,
  now() - interval '3 days'
),
(
  'eeeeeeee-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000011',  -- carpintero Mendez
  'Carlos Mendez',
  '22.543.100',
  true,
  now() - interval '3 days'
);

-- ============================================================
-- SOLICITUD DE MATERIALES
-- ============================================================
insert into public.solicitudes_materiales
  (id, carpintero_id, proveedor_id, licitacion_id, estado) values
(
  'ffffffff-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000031',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'cotizada'
);

insert into public.items_solicitud
  (solicitud_id, descripcion, cantidad, precio_unitario) values
(
  'ffffffff-0000-0000-0000-000000000001',
  'Perfil serie 30 — 6 metros',
  20,
  3200.00
),
(
  'ffffffff-0000-0000-0000-000000000001',
  'Herraje plegable juego completo',
  8,
  4500.00
),
(
  'ffffffff-0000-0000-0000-000000000001',
  'Tornillería y burletes',
  1,
  1200.00
);

-- ============================================================
-- CITAS
-- ============================================================
insert into public.citas
  (licitacion_id, carpintero_id, cliente_id, fecha_propuesta, estado, notas) values
(
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000021',
  now() + interval '2 days',
  'confirmada',
  'Visita de medición. El cliente confirmó acceso por el portero eléctrico.'
),
(
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000021',
  now() + interval '3 days',
  'propuesta',
  'Solicito visitar el martes a las 10hs.'
);

-- ============================================================
-- NOTIFICACIONES
-- ============================================================
insert into public.notificaciones
  (usuario_id, tipo, titulo, mensaje, leida, link) values

-- Para el cliente Sebastián: recibió cotizaciones
('00000000-0000-0000-0000-000000000021',
 'cotizacion',
 'Nueva cotización recibida',
 'Carlos Mendez cotizó $385.000 para tu licitación "Ventanas DVH para departamento 3 ambientes".',
 false,
 '/licitaciones/aaaaaaaa-0000-0000-0000-000000000001'),

('00000000-0000-0000-0000-000000000021',
 'cotizacion',
 'Nueva cotización recibida',
 'Diego Ferreyra cotizó $310.000 para tu licitación "Ventanas DVH para departamento 3 ambientes".',
 false,
 '/licitaciones/aaaaaaaa-0000-0000-0000-000000000001'),

('00000000-0000-0000-0000-000000000021',
 'cotizacion',
 'Nueva cotización recibida',
 'Ana Gómez cotizó $275.000 para tu licitación "Ventanas DVH para departamento 3 ambientes".',
 true,
 '/licitaciones/aaaaaaaa-0000-0000-0000-000000000001'),

-- Para el carpintero Mendez: etapa en revisión
('00000000-0000-0000-0000-000000000011',
 'etapa',
 'Cliente revisando etapa',
 'Valentina Cruz está revisando la etapa "Fabricación de perfiles y corte" en el cerramiento de balcón.',
 false,
 '/licitaciones/aaaaaaaa-0000-0000-0000-000000000002'),

-- Para el carpintero Mendez: pago confirmado
('00000000-0000-0000-0000-000000000011',
 'pago',
 'Anticipo confirmado',
 'Se confirmó el anticipo de $59.400 para la obra "Cerramiento de balcón 8m²".',
 true,
 '/licitaciones/aaaaaaaa-0000-0000-0000-000000000002'),

-- Para Valentina: su licitación fue adjudicada
('00000000-0000-0000-0000-000000000022',
 'sistema',
 'Licitación adjudicada',
 'Tu licitación "Cerramiento de balcón 8m²" fue adjudicada a Carlos Mendez.',
 true,
 '/licitaciones/aaaaaaaa-0000-0000-0000-000000000002'),

-- Para carpintero Silva: su cotización perdió
('00000000-0000-0000-0000-000000000012',
 'cotizacion',
 'Licitación adjudicada a otro carpintero',
 'La licitación "Cerramiento de balcón 8m²" fue adjudicada a otro profesional.',
 false,
 '/licitaciones');

-- ============================================================
-- MENSAJES (chat en licitación 2)
-- ============================================================
insert into public.mensajes (licitacion_id, autor_id, contenido) values
(
  'aaaaaaaa-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000022',
  'Hola Carlos, quería consultarte sobre el tipo de vidrio que vas a usar.'
),
(
  'aaaaaaaa-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000011',
  'Buenas Valentina. Voy a usar vidrio laminado 4+4mm para mayor seguridad y aislación acústica. ¿Te parece bien?'
),
(
  'aaaaaaaa-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000022',
  'Perfecto, muchas gracias por la aclaración.'
);

-- ============================================================
-- MOVIMIENTOS (carpintero Mendez — anticipo recibido)
-- ============================================================
insert into public.movimientos (perfil_id, tipo, monto, descripcion) values
(
  '00000000-0000-0000-0000-000000000011',
  'credito',
  59400.00,
  'Anticipo 30% — Cerramiento de balcón 8m² (Valentina Cruz)'
);

update public.perfiles
set saldo_billetera = 59400.00
where id = '00000000-0000-0000-0000-000000000011';
