'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeLicitacion(
  licitacionId: string | null,
  onUpdate: () => void
) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!licitacionId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`licitacion-${licitacionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cotizaciones',
          filter: `licitacion_id=eq.${licitacionId}`,
        },
        () => onUpdateRef.current()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'etapas_certificacion',
          filter: `licitacion_id=eq.${licitacionId}`,
        },
        () => onUpdateRef.current()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'licitaciones',
          filter: `id=eq.${licitacionId}`,
        },
        () => onUpdateRef.current()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contrato_firma',
          filter: `licitacion_id=eq.${licitacionId}`,
        },
        () => onUpdateRef.current()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [licitacionId])
}
