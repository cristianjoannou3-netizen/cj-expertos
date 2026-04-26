'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import type { Notificacion } from '@/types/licitacion'

const TIPO_ICONO: Record<string, string> = {
  cotizacion: '💬',
  pago: '💰',
  etapa: '📋',
  sistema: 'ℹ️',
  mensaje: '✉️',
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins}m`
  const hs = Math.floor(mins / 60)
  if (hs < 24) return `Hace ${hs}h`
  const dias = Math.floor(hs / 24)
  return `Hace ${dias}d`
}

interface Props {
  notificaciones: Notificacion[]
  userId: string
}

export default function NotificacionesClient({ notificaciones: initialNotifs, userId }: Props) {
  const [notifs, setNotifs] = useState(initialNotifs)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const marcarLeida = async (id: string) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  const marcarTodasLeidas = async () => {
    setLoading(true)
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', userId)
      .eq('leida', false)
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
    setLoading(false)
  }

  const noLeidas = notifs.filter(n => !n.leida)

  if (notifs.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-slate-400">No tenés notificaciones aún</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {noLeidas.length > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" loading={loading} onClick={marcarTodasLeidas}>
            <CheckCheck size={14} /> Marcar todas como leídas
          </Button>
        </div>
      )}

      <Card padding="none">
        {notifs.map((n, i) => (
          <div
            key={n.id}
            className={`flex gap-3 p-4 transition-colors ${
              i !== 0 ? 'border-t border-slate-100' : ''
            } ${!n.leida ? 'bg-[var(--surface)]' : 'bg-white'}`}
          >
            <div className="text-xl shrink-0 mt-0.5">
              {TIPO_ICONO[n.tipo] ?? '🔔'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800 text-sm">{n.titulo}</p>
                {!n.leida && (
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" />
                )}
              </div>
              {n.mensaje && (
                <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.mensaje}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-slate-400">{tiempoRelativo(n.created_at)}</span>
                {n.link && (
                  <Link
                    href={n.link}
                    className="text-xs text-[var(--primary)] font-semibold hover:underline"
                    onClick={() => !n.leida && marcarLeida(n.id)}
                  >
                    Ver →
                  </Link>
                )}
                {!n.leida && (
                  <button
                    onClick={() => marcarLeida(n.id)}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
