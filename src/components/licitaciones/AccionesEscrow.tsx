'use client'
import { useState } from 'react'
import { DollarSign, Unlock, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Licitacion, EtapaCertificacion } from '@/types/licitacion'
import type { Perfil } from '@/types/perfil'

interface Props {
  licitacion: Licitacion
  etapas: EtapaCertificacion[]
  perfil: Perfil
  onRefresh: () => void
}

export default function AccionesEscrow({ licitacion, etapas, perfil, onRefresh }: Props) {
  const [loading60, setLoading60] = useState(false)
  const [loadingFinalizar, setLoadingFinalizar] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const isCliente = perfil.id === licitacion.cliente_id

  if (!isCliente) return null

  const todasAprobadas =
    etapas.length > 0 && etapas.every(e => e.estado === 'aprobada')

  const handleLiberar60 = async () => {
    setLoading60(true)
    setError('')
    setMsg('')
    try {
      const res = await fetch('/api/pagos/liberar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licitacion_id: licitacion.id, tramo: 2 }),
      })
      const data = await res.json() as { ok?: boolean; monto?: number; mensaje?: string; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Error al liberar fondos')
      } else {
        setMsg(data.mensaje ?? `60% liberado correctamente. Monto: $${data.monto?.toLocaleString('es-AR') ?? ''}`)
        onRefresh()
      }
    } catch {
      setError('Error de red al liberar fondos')
    } finally {
      setLoading60(false)
    }
  }

  const handleFinalizar = async () => {
    setLoadingFinalizar(true)
    setError('')
    setMsg('')
    try {
      const res = await fetch('/api/pagos/liberar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licitacion_id: licitacion.id, tramo: 3 }),
      })
      const data = await res.json() as { ok?: boolean; neto?: number; mensaje?: string; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Error al finalizar obra')
      } else {
        setMsg(data.mensaje ?? `Obra finalizada. Neto acreditado: $${data.neto?.toLocaleString('es-AR') ?? ''}`)
        onRefresh()
      }
    } catch {
      setError('Error de red al finalizar obra')
    } finally {
      setLoadingFinalizar(false)
    }
  }

  return (
    <div className="bg-[var(--card)] rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign size={18} className="text-[var(--success)]" />
        <h3 className="font-bold text-slate-800">Gestión de pagos (Escrow)</h3>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}
      {msg && (
        <p className="text-sm text-[var(--success)] bg-green-50 rounded-xl px-3 py-2 flex items-center gap-2">
          <CheckCircle size={14} /> {msg}
        </p>
      )}

      <div className="space-y-3">
        {/* Liberar 60% */}
        {licitacion.estado === 'adjudicada' && (
          <div className="border border-slate-100 rounded-xl p-4 space-y-2">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Liberar 60% para materiales</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Autoriza la liberación del 60% del monto cotizado al carpintero para la compra de materiales.
                La obra pasará a estado &quot;En curso&quot;.
              </p>
            </div>
            <Button
              size="sm"
              loading={loading60}
              onClick={handleLiberar60}
              className="w-full"
            >
              <Unlock size={14} /> Liberar 60% de materiales
            </Button>
          </div>
        )}

        {/* Finalizar obra */}
        {licitacion.estado === 'en_curso' && (
          <div className="border border-slate-100 rounded-xl p-4 space-y-2">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Finalizar obra</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Autoriza la liberación del saldo final al carpintero y cierra la licitación.
                Requiere todas las etapas aprobadas.
              </p>
            </div>
            {!todasAprobadas && etapas.length > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Quedan {etapas.filter(e => e.estado !== 'aprobada').length} etapa(s) pendientes de aprobar.
              </p>
            )}
            <Button
              size="sm"
              variant="secondary"
              loading={loadingFinalizar}
              disabled={etapas.length > 0 && !todasAprobadas}
              onClick={handleFinalizar}
              className="w-full"
            >
              <CheckCircle size={14} /> Finalizar obra
            </Button>
          </div>
        )}

        {licitacion.estado === 'completada' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-[var(--success)] shrink-0" />
            <div>
              <p className="font-semibold text-[var(--success)]">Obra completada</p>
              <p className="text-xs text-slate-500">Todos los fondos fueron liberados correctamente.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
