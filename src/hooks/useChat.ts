'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Mensaje {
  id: string
  licitacion_id: string
  autor_id: string
  contenido: string
  created_at: string
}

export function useChat(licitacionId: string, autorId: string) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())

  // Carga inicial
  useEffect(() => {
    if (!licitacionId) return
    const supabase = supabaseRef.current

    setLoading(true)
    supabase
      .from('mensajes')
      .select('*')
      .eq('licitacion_id', licitacionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMensajes((data ?? []) as Mensaje[])
        setLoading(false)
      })
  }, [licitacionId])

  // Suscripción realtime
  useEffect(() => {
    if (!licitacionId) return
    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`chat-${licitacionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `licitacion_id=eq.${licitacionId}`,
        },
        (payload) => {
          const nuevo = payload.new as Mensaje
          setMensajes(prev => {
            // Evitar duplicados
            if (prev.some(m => m.id === nuevo.id)) return prev
            return [...prev, nuevo]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [licitacionId])

  const enviarMensaje = useCallback(async (contenido: string) => {
    const texto = contenido.trim()
    if (!texto || !licitacionId || !autorId) return

    const supabase = supabaseRef.current
    await supabase.from('mensajes').insert({
      licitacion_id: licitacionId,
      autor_id: autorId,
      contenido: texto,
    })
  }, [licitacionId, autorId])

  return { mensajes, loading, enviarMensaje }
}
