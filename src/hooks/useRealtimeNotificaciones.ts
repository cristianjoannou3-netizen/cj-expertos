'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notificacion } from '@/types/licitacion'

export function useRealtimeNotificaciones(
  userId: string | null,
  onNueva: (n: Notificacion) => void
) {
  const onNuevaRef = useRef(onNueva)
  onNuevaRef.current = onNueva

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`notificaciones-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${userId}`,
        },
        (payload) => {
          onNuevaRef.current(payload.new as Notificacion)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
