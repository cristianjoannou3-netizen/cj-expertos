-- Migración: MP Marketplace split payment
-- Ejecutar en Supabase SQL editor

-- Nuevos campos en perfiles para MP Connect (carpinteros)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS mp_access_token text;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS mp_refresh_token text;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS mp_user_id text;

-- Datos bancarios para transferencias directas al carpintero
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS cbu text;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS alias_bancario text;

-- Campo en pagos para rastrear el disbursement de MP
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS mp_disbursement_id text;

-- El campo estado en pagos ahora incluye 'retenido' (fondos retenidos por MP)
-- Los valores posibles son: 'pendiente', 'retenido', 'confirmado', 'liberado', 'rechazado'
-- 'retenido' = MP aprobó el pago pero los fondos aún no fueron liberados al carpintero
-- 'liberado'  = CJ Expertos autorizó la liberación vía disbursement
