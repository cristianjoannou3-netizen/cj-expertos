-- Migración: Agregar campos especialidades y zonas_cobertura al perfil del carpintero
-- Ejecutar en Supabase SQL Editor

ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS especialidades text[] DEFAULT '{}';
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS zonas_cobertura text[] DEFAULT '{}';

-- Índice GIN para búsquedas eficientes sobre arrays
CREATE INDEX IF NOT EXISTS idx_perfiles_especialidades ON perfiles USING GIN (especialidades);
CREATE INDEX IF NOT EXISTS idx_perfiles_zonas_cobertura ON perfiles USING GIN (zonas_cobertura);
