'use client'
import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeLicitacion } from '@/hooks/useRealtimeLicitacion'
import type { Licitacion, Cotizacion } from '@/types/licitacion'
import type { Perfil } from '@/types/perfil'

interface Props {
  licitacion: Licitacion
  cotizaciones: Cotizacion[]
  perfil: Perfil
  carpinterosMap: Record<string, Perfil>
  onRefresh: () => void
}

export default function CotizacionesPanel({
  licitacion,
  cotizaciones,
  perfil,
  carpinterosMap,
  onRefresh,
}: Props) {
  const [monto, setMonto] = useState('')
  const [detalle, setDetalle] = useState('')
  const [loading, setLoading] = useState(false)
  const [eligiendoId, setEligiendoId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  // Realtime: actualizar cuando llega nueva cotización
  useRealtimeLicitacion(licitacion.id, onRefresh)

  const isCliente = perfil.rol === 'cliente' || perfil.id === licitacion.cliente_id
  const isCarpintero = perfil.rol === 'carpintero'
  const yaCotizo = cotizaciones.find(c => c.carpintero_id === perfil.id)

  // Para vista cliente: identificar el carpintero elegido (la primera cotización de licitación no abierta)
  const carpinteroElegidoId =
    licitacion.estado !== 'abierta' && cotizaciones.length > 0
      ? cotizaciones[0].carpintero_id
      : null

  const handleCotizar = async () => {
    if (!monto || Number(monto) <= 0 || !detalle) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('cotizaciones').insert({
      licitacion_id: licitacion.id,
      carpintero_id: perfil.id,
      monto: Number(monto),
      detalle,
    })
    if (err) {
      setError(err.message)
    } else {
      // Notificar al cliente
      await supabase.from('notificaciones').insert({
        usuario_id: licitacion.cliente_id,
        tipo: 'cotizacion',
        titulo: 'Nueva cotización recibida',
        mensaje: `${perfil.nombre} cotizó $${Number(monto).toLocaleString('es-AR')} para "${licitacion.titulo}"`,
        link: `/licitaciones/${licitacion.id}`,
      })
      // Email al cliente (fire-and-forget)
      const { data: clientePerfil } = await supabase
        .from('perfiles').select('email,nombre').eq('id', licitacion.cliente_id).single()
      if (clientePerfil?.email) {
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'nueva_cotizacion',
            datos: {
              emailCliente: clientePerfil.email,
              nombreCliente: clientePerfil.nombre,
              licitacionTitulo: licitacion.titulo,
              licitacionId: licitacion.id,
            },
          }),
        }).catch(() => null)
      }
      setMonto('')
      setDetalle('')
      onRefresh()
    }
    setLoading(false)
  }

  const handleElegir = async (carpinteroId: string) => {
    setEligiendoId(carpinteroId)
    setError('')
    const { error: err } = await supabase
      .from('licitaciones')
      .update({ estado: 'adjudicada' })
      .eq('id', licitacion.id)
    if (err) {
      setError(err.message)
    } else {
      // Notificar al carpintero elegido
      await supabase.from('notificaciones').insert({
        usuario_id: carpinteroId,
        tipo: 'cotizacion',
        titulo: 'Tu cotización fue aceptada',
        mensaje: `Fuiste seleccionado para "${licitacion.titulo}". El cliente procederá con el pago.`,
        link: `/licitaciones/${licitacion.id}`,
      })
      // Email al carpintero (fire-and-forget)
      const { data: carpPerfil } = await supabase
        .from('perfiles').select('email,nombre').eq('id', carpinteroId).single()
      if (carpPerfil?.email) {
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'carpintero_elegido',
            datos: {
              emailCarpintero: carpPerfil.email,
              nombreCarpintero: carpPerfil.nombre,
              licitacionTitulo: licitacion.titulo,
              licitacionId: licitacion.id,
            },
          }),
        }).catch(() => null)
      }
      onRefresh()
    }
    setEligiendoId(null)
  }

  const cotizacionesVisibles = isCliente
    ? cotizaciones
    : cotizaciones.filter(c => c.carpintero_id === perfil.id)

  return (
    <div className="bg-[var(--card)] rounded-2xl shadow-sm p-5 space-y-4">
      <h3 className="font-bold text-slate-800 text-base">
        Cotizaciones ({isCliente ? cotizaciones.length : (yaCotizo ? 1 : 0)})
      </h3>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      {cotizacionesVisibles.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">Aún no hay cotizaciones</p>
      )}

      <div className="space-y-3">
        {cotizacionesVisibles.map(c => {
          const esElegido = c.carpintero_id === carpinteroElegidoId
          const carp = carpinterosMap[c.carpintero_id]
          return (
            <div
              key={c.id}
              className={`p-4 rounded-xl border-2 transition-colors ${
                esElegido ? 'border-[var(--primary)] bg-[var(--surface)]' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-800">{carp?.nombre ?? c.carpintero_id}</p>
                  {carp && (
                    <p className="text-xs text-slate-500">
                      {carp.ciudad && `${carp.ciudad} · `}
                      {carp.experiencia ? `${carp.experiencia} años exp.` : ''}
                      {carp.verificado && (
                        <span className="ml-1 text-[var(--primary)] bg-[var(--surface)] border border-sky-100 px-1.5 rounded-full">
                          ✓ Verificado
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <p className="text-xl font-black text-[var(--primary)]">
                  ${c.monto.toLocaleString('es-AR')}
                </p>
              </div>
              {c.detalle && (
                <p className="text-sm text-slate-600 mt-2">{c.detalle}</p>
              )}
              {esElegido && (
                <div className="flex items-center gap-1 mt-2 text-[var(--primary)] text-xs font-semibold">
                  <CheckCircle size={14} /> Carpintero elegido
                </div>
              )}
              {isCliente && licitacion.estado === 'abierta' && !carpinteroElegidoId && (
                <Button
                  size="sm"
                  className="mt-3"
                  loading={eligiendoId === c.carpintero_id}
                  onClick={() => handleElegir(c.carpintero_id)}
                >
                  Elegir esta oferta
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Formulario para cotizar — solo carpintero invitado que no cotizó */}
      {isCarpintero && licitacion.estado === 'abierta' && !yaCotizo && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <h4 className="font-semibold text-slate-700 text-sm">Enviar tu cotización</h4>
          <Input
            label="Monto total ($)"
            type="number"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="0.00"
            min="0"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Detalle / desglose
            </label>
            <textarea
              value={detalle}
              onChange={e => setDetalle(e.target.value)}
              rows={3}
              className="w-full bg-[var(--surface)] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none transition-all"
              placeholder="Describí qué incluye tu cotización..."
            />
          </div>
          <Button
            onClick={handleCotizar}
            loading={loading}
            disabled={!monto || !detalle || Number(monto) <= 0}
            className="w-full"
          >
            Enviar cotización
          </Button>
        </div>
      )}

      {yaCotizo && (
        <p className="text-sm text-[var(--success)] font-medium flex items-center gap-1">
          <CheckCircle size={14} /> Ya enviaste tu cotización
        </p>
      )}

      {isCarpintero && licitacion.estado !== 'abierta' && !yaCotizo && (
        <p className="text-sm text-slate-400 text-center py-2">
          Esta licitación ya no está abierta para cotizaciones.
        </p>
      )}
    </div>
  )
}
