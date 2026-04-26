'use client'
import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import type { Movimiento } from '@/types/licitacion'

type RetiroConPerfil = Movimiento & { perfiles: { nombre: string; email: string | null } }

interface Props {
  retiros: RetiroConPerfil[]
}

export default function RetirosAdmin({ retiros: initialRetiros }: Props) {
  const [retiros, setRetiros] = useState(initialRetiros)
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const supabase = createClient()

  async function handleAccion(id: string, accion: 'completado' | 'rechazado') {
    setLoading(id)
    setMsg('')
    const { error } = await supabase
      .from('movimientos')
      .update({ estado: accion })
      .eq('id', id)

    if (error) {
      setMsg(`Error: ${error.message}`)
    } else {
      setRetiros(prev => prev.filter(r => r.id !== id))
      setMsg(`Retiro ${accion === 'completado' ? 'aprobado' : 'rechazado'} correctamente.`)
    }
    setLoading(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Solicitudes de retiro pendientes</h2>

      {msg && (
        <p className="text-sm text-[var(--success)] bg-green-50 rounded-xl px-3 py-2">{msg}</p>
      )}

      {retiros.length === 0 ? (
        <Card padding="lg">
          <p className="text-slate-400 text-center">No hay retiros pendientes.</p>
        </Card>
      ) : (
        <Card padding="none">
          {retiros.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center justify-between gap-4 p-4 flex-wrap ${i !== 0 ? 'border-t border-slate-100' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{r.perfiles?.nombre ?? 'Usuario'}</p>
                <p className="text-xs text-slate-500">{r.perfiles?.email ?? ''}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.descripcion}</p>
                <p className="text-xs text-slate-400">
                  {new Date(r.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="font-black text-slate-800">${r.monto.toLocaleString('es-AR')}</p>
                <Button
                  size="sm"
                  loading={loading === r.id}
                  onClick={() => handleAccion(r.id, 'completado')}
                  className="flex items-center gap-1"
                >
                  <CheckCircle size={13} /> Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={loading === r.id}
                  onClick={() => handleAccion(r.id, 'rechazado')}
                  className="flex items-center gap-1"
                >
                  <XCircle size={13} /> Rechazar
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
