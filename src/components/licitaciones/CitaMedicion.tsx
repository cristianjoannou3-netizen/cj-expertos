'use client'
import { useState } from 'react'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { Cita, Licitacion } from '@/types/licitacion'
import type { Perfil } from '@/types/perfil'

interface Props {
  licitacion: Licitacion
  citas: Cita[]
  perfil: Perfil
  carpinteroElegidoId: string | null
  onRefresh: () => void
}

const ESTADO_CITA = {
  propuesta: { label: 'Propuesta', variant: 'warning' as const },
  confirmada: { label: 'Confirmada', variant: 'success' as const },
  rechazada: { label: 'Rechazada', variant: 'danger' as const },
  completada: { label: 'Completada', variant: 'neutral' as const },
}

export default function CitaMedicion({
  licitacion,
  citas,
  perfil,
  carpinteroElegidoId,
  onRefresh,
}: Props) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()
  const isCliente = perfil.id === licitacion.cliente_id
  const isCarpinteroAdj = perfil.id === carpinteroElegidoId

  const handleProponerCita = async () => {
    if (!fecha) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('citas').insert({
      licitacion_id: licitacion.id,
      carpintero_id: carpinteroElegidoId ?? perfil.id,
      cliente_id: licitacion.cliente_id,
      fecha_propuesta: new Date(fecha).toISOString(),
      notas: notas.trim() || null,
    })
    if (err) {
      setError(err.message)
    } else {
      await supabase.from('notificaciones').insert({
        usuario_id: licitacion.cliente_id,
        tipo: 'sistema',
        titulo: 'Solicitud de visita de medición',
        mensaje: `${perfil.nombre} quiere coordinar una visita el ${new Date(fecha).toLocaleDateString('es-AR')}.`,
        link: `/licitaciones/${licitacion.id}`,
      })
      setMostrarForm(false)
      setFecha('')
      setNotas('')
      onRefresh()
    }
    setLoading(false)
  }

  const handleAccion = async (citaId: string, nuevoEstado: 'confirmada' | 'rechazada') => {
    setProcessingId(citaId)
    const { error: err } = await supabase
      .from('citas')
      .update({ estado: nuevoEstado })
      .eq('id', citaId)
    if (!err) onRefresh()
    setProcessingId(null)
  }

  return (
    <div className="bg-[var(--card)] rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar size={18} className="text-[var(--primary)]" />
        <h3 className="font-bold text-slate-800">Cita de medición</h3>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      {citas.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-2">No hay citas programadas</p>
      )}

      <div className="space-y-3">
        {citas.map(cita => {
          const cfg = ESTADO_CITA[cita.estado]
          return (
            <div key={cita.id} className="border border-slate-100 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {new Date(cita.fecha_propuesta).toLocaleDateString('es-AR', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(cita.fecha_propuesta).toLocaleTimeString('es-AR', {
                      hour: '2-digit', minute: '2-digit',
                    })}hs
                  </p>
                </div>
                <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
              </div>

              {cita.notas && (
                <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                  {cita.notas}
                </p>
              )}

              {isCliente && cita.estado === 'propuesta' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    loading={processingId === cita.id}
                    onClick={() => handleAccion(cita.id, 'confirmada')}
                  >
                    <CheckCircle size={13} /> Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={processingId === cita.id}
                    onClick={() => handleAccion(cita.id, 'rechazada')}
                  >
                    <XCircle size={13} /> Rechazar
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isCarpinteroAdj && (
        <>
          {!mostrarForm ? (
            <button
              onClick={() => setMostrarForm(true)}
              className="flex items-center gap-2 text-sm text-[var(--primary)] font-semibold border border-dashed border-[var(--primary)]/40 rounded-xl px-4 py-2.5 hover:bg-[var(--primary)]/5 w-full justify-center transition-colors"
            >
              <Calendar size={14} /> Proponer fecha de visita
            </button>
          ) : (
            <div className="space-y-3 border border-slate-100 rounded-xl p-4 bg-[var(--surface)]">
              <h4 className="text-sm font-semibold text-slate-700">Proponer fecha de visita</h4>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Fecha y hora
                </label>
                <input
                  type="datetime-local"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Notas (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none transition-all"
                  placeholder="Ej: Llevar planos de los vanos"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleProponerCita} loading={loading} disabled={!fecha} size="sm">
                  Enviar propuesta
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMostrarForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
