-- =============================================
-- CJ EXPERTOS — Migración Fase 4: MP + Billetera
-- Ejecutar en: Supabase → SQL Editor → New query
-- DESPUÉS de supabase_rpc_escrow.sql
-- =============================================

-- 1. Columna mp_payment_id en pagos
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS mp_payment_id text;
CREATE INDEX IF NOT EXISTS idx_pagos_mp ON public.pagos(mp_payment_id);

-- 2. Columna estado en movimientos (retiros)
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'completado';
-- Valores: 'completado' | 'pendiente' | 'rechazado'

-- 3. Columna cbu_alias en movimientos (para retiros)
ALTER TABLE public.movimientos ADD COLUMN IF NOT EXISTS cbu_alias text;

-- 4. Índice para filtrar retiros pendientes
CREATE INDEX IF NOT EXISTS idx_movimientos_estado ON public.movimientos(perfil_id, estado);

-- 5. Política: admin puede actualizar movimientos (aprobar/rechazar retiros)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'movimientos'
      AND policyname = 'mov_update_admin'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "mov_update_admin" ON public.movimientos
        FOR UPDATE USING (public.es_admin());
    $pol$;
  END IF;
END;
$$;

-- 6. Política: admin puede ver todos los movimientos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'movimientos'
      AND policyname = 'mov_select_admin'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "mov_select_admin" ON public.movimientos
        FOR SELECT USING (public.es_admin());
    $pol$;
  END IF;
END;
$$;

-- 7. Política: admin puede insertar notificaciones para cualquier usuario
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'notificaciones'
      AND policyname = 'notif_insert_admin'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "notif_insert_admin" ON public.notificaciones
        FOR INSERT WITH CHECK (public.es_admin());
    $pol$;
  END IF;
END;
$$;

-- 8. Política: admin puede ver todos los pagos (ya existe pagos_select, pero ampliamos)
-- La política existente ya incluye es_admin(), no es necesario agregar otra.

-- Fin migración Fase 4
