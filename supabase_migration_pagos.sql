-- Migración: Modelo de pagos actualizado
-- Ejecutar en Supabase SQL Editor

-- 1. URL del comprobante de transferencia bancaria
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS comprobante_url text;

-- 2. Monto con recargo de Mercado Pago (cobra 5.4% = 4.5% + IVA)
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS monto_mp numeric;

-- 3. Bucket para comprobantes (crear en Supabase Storage si no existe)
-- Nombre del bucket: comprobantes
-- Políticas sugeridas:
--   - INSERT: autenticado (el cliente puede subir su comprobante)
--   - SELECT público o solo admin

-- Comentario: monto_mp se llena solo cuando el pago es por Mercado Pago
-- y refleja el monto_original + recargo (5.4%). El campo monto sigue siendo
-- el monto de la obra sin recargo.
