'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const LABELS: Record<string, string> = {
  borrador:    'Borrador',
  cotizacion:  'Cotización',
  acopio:      'Acopio',
  fabricacion: 'Fabricación',
  entrega:     'Entrega',
  colocacion:  'Colocación',
  finalizada:  'Finalizada',
  cancelada:   'Cancelada',
}

const CODIGOS_MENSAJE: Record<string, string> = {
  YA_FINALIZADA: 'Esta obra ya fue finalizada anteriormente.',
  YA_LIQUIDADA:  'Esta obra ya tiene movimientos registrados. No se puede liquidar dos veces.',
  FALTA_ACOPIO:  'Cargá el monto de acopio cobrado al cliente antes de finalizar.',
  FALTA_COSTOS:  'Cargá los costos de materiales antes de finalizar.',
  NOT_FOUND:     'Obra no encontrada o sin permisos.',
  ERROR_INTERNO: 'Error interno del servidor. Intentá nuevamente.',
}

export default function CambiarEstado({ obraId, estadoActual, estados, carpinteroId }: {
  obraId: string
  estadoActual: string
  estados: string[]
  carpinteroId: string
}) {
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(estadoActual)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error' | 'warning'>('success')
  const supabase = createClient()
  const router = useRouter()

  async function guardar() {
    if (loading) return
    setLoading(true)
    setMsg('')

    try {
      // Caso especial: finalizar obra → usar RPC atómica del backend
      if (estadoSeleccionado === 'finalizada' && estadoActual !== 'finalizada') {
        const { data, error } = await supabase.rpc('finalizar_obra', {
          p_obra_id:  obraId,
          p_user_id:  carpinteroId,
        })

        if (error) {
          setMsgType('error')
          setMsg('Error al comunicarse con el servidor. Intentá nuevamente.')
          setLoading(false)
          return
        }

        const resultado = data as {
          ok: boolean
          code: string
          mensaje: string
          sobrante?: number
          comision?: number
          neto?: number
        }

        if (!resultado.ok) {
          const esCritico = resultado.code === 'YA_FINALIZADA' || resultado.code === 'YA_LIQUIDADA'
          setMsgType(esCritico ? 'warning' : 'error')
          setMsg(CODIGOS_MENSAJE[resultado.code] || resultado.mensaje)
          setLoading(false)
          return
        }

        // Éxito: mostrar resumen financiero
        const neto = resultado.neto ?? 0
        const sobrante = resultado.sobrante ?? 0
        const comision = resultado.comision ?? 0
        const signo = neto >= 0 ? '+' : ''
        setMsgType('success')
        setMsg(
          `✅ Obra finalizada. Sobrante: $${Math.abs(sobrante).toLocaleString('es-AR')} · ` +
          `Comisión: $${comision.toLocaleString('es-AR')} · ` +
          `Neto acreditado: ${signo}$${Math.abs(neto).toLocaleString('es-AR')}`
        )
        router.refresh()
        setLoading(false)
        return
      }

      // Caso normal: cambiar estado sin lógica financiera
      const { error } = await supabase
        .from('obras')
        .update({ estado: estadoSeleccionado })
        .eq('id', obraId)
        .eq('carpintero_id', carpinteroId)

      if (error) throw new Error(error.message)

      setMsgType('success')
      setMsg('✅ Estado actualizado.')
      router.refresh()

    } catch (err: unknown) {
      setMsgType('error')
      setMsg(err instanceof Error ? err.message : 'Error inesperado. Intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const cambioPendiente = estadoSeleccionado !== estadoActual
  const esFinalizacion  = estadoSeleccionado === 'finalizada' && estadoActual !== 'finalizada'
  const yaFinalizada    = estadoActual === 'finalizada'

  return (
    <div className="space-y-3">

      {/* Botones de estado */}
      <div className="flex flex-wrap gap-2">
        {estados.map(e => {
          const esFinalizada = e === 'finalizada'
          const deshabilitado = yaFinalizada && esFinalizada
          return (
            <button
              key={e}
              onClick={() => !deshabilitado && setEstadoSeleccionado(e)}
              disabled={deshabilitado}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${
                estadoSeleccionado === e
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : deshabilitado
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}>
              {LABELS[e] || e}
            </button>
          )
        })}
      </div>

      {/* Aviso previo a finalizar */}
      {esFinalizacion && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium leading-relaxed">
          <span className="font-bold">Antes de finalizar verificá:</span>
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            <li>Monto de acopio cobrado al cliente cargado</li>
            <li>Costos de aluminio, vidrio y accesorios cargados</li>
          </ul>
          <p className="mt-1.5 text-amber-700">
            Al confirmar se calculará el sobrante y se acreditará en tu billetera.
            Esta acción no puede deshacerse.
          </p>
        </div>
      )}

      {/* Obra ya finalizada — sin acción posible */}
      {yaFinalizada && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-medium">
          Esta obra ya fue finalizada y su saldo fue acreditado. No se pueden generar más movimientos sobre ella.
        </div>
      )}

      {/* Botón guardar */}
      <div className="flex items-start gap-3 flex-wrap">
        <button
          onClick={guardar}
          disabled={loading || !cambioPendiente || yaFinalizada}
          className={`font-bold px-5 py-2.5 rounded-xl transition-colors text-sm text-white ${
            esFinalizacion
              ? 'bg-green-600 hover:bg-green-700 disabled:opacity-50'
              : 'bg-[var(--primary)] hover:bg-[var(--primary-mid)] disabled:opacity-50'
          }`}>
          {loading
            ? (esFinalizacion ? 'Finalizando...' : 'Guardando...')
            : (esFinalizacion ? 'Confirmar finalización' : 'Guardar cambio')}
        </button>

        {msg && (
          <div className={`text-sm font-semibold max-w-sm ${
            msgType === 'error'   ? 'text-red-600'    :
            msgType === 'warning' ? 'text-amber-600'  :
                                    'text-green-600'
          }`}>
            {msg}
          </div>
        )}
      </div>

    </div>
  )
}
