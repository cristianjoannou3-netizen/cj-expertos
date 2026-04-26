'use client'
import { useState, useMemo } from 'react'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { Package, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { BadgeVariant } from '@/components/ui/Badge'

interface ItemSolicitud {
  id: string
  solicitud_id: string
  descripcion: string
  cantidad: number
  precio_unitario: number | null
}

interface Solicitud {
  id: string
  estado: string
  created_at: string
  licitacion_id: string | null
  carpintero_id: string
  proveedor_id: string | null
  items_solicitud?: ItemSolicitud[]
  licitaciones?: { id: string; titulo: string } | null
  perfiles?: { id: string; nombre: string; empresa: string | null } | null
}

interface Props {
  solicitudes: Solicitud[]
  proveedorId: string
}

const ESTADO_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  borrador:  { label: 'Borrador',  variant: 'neutral' },
  enviada:   { label: 'Enviada',   variant: 'warning' },
  cotizada:  { label: 'Cotizada',  variant: 'info' },
  aprobada:  { label: 'Aprobada',  variant: 'success' },
  entregada: { label: 'Entregada', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'neutral' },
}

function formatARS(n: number) {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function ItemPrecioForm({
  item,
  onGuardar,
}: {
  item: ItemSolicitud
  onGuardar: (itemId: string, precio: number) => Promise<void>
}) {
  const [precio, setPrecio] = useState(item.precio_unitario != null ? String(item.precio_unitario) : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(item.precio_unitario != null)

  async function handleGuardar() {
    const val = parseFloat(precio)
    if (isNaN(val) || val <= 0) return
    setSaving(true)
    await onGuardar(item.id, val)
    setSaved(true)
    setSaving(false)
  }

  if (saved && item.precio_unitario != null) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-700">
        <CheckCircle size={12} />
        {formatARS(item.precio_unitario)} c/u
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={precio}
        onChange={e => setPrecio(e.target.value)}
        placeholder="Precio unitario"
        className="w-32 px-2 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
      <button
        type="button"
        disabled={saving || !precio || parseFloat(precio) <= 0}
        onClick={handleGuardar}
        className="inline-flex items-center gap-1 text-xs font-semibold bg-[var(--primary)] hover:bg-[var(--primary-mid)] disabled:opacity-50 text-white px-3 py-1 rounded-lg transition-colors"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
        Guardar
      </button>
    </div>
  )
}

export default function SolicitudesClient({ solicitudes: initialSolicitudes, proveedorId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(initialSolicitudes)
  const [respondiendo, setRespondiendo] = useState<string | null>(null)
  const [precios, setPrecios] = useState<Record<string, Record<string, number>>>({})
  const [msg, setMsg] = useState('')
  const [loadingItems, setLoadingItems] = useState<string | null>(null)

  async function cargarItems(solId: string) {
    if (solicitudes.find(s => s.id === solId)?.items_solicitud) {
      setRespondiendo(respondiendo === solId ? null : solId)
      return
    }
    setLoadingItems(solId)
    const { data } = await supabase
      .from('items_solicitud')
      .select('*')
      .eq('solicitud_id', solId)
      .order('created_at')
    setSolicitudes(prev =>
      prev.map(s => s.id === solId ? { ...s, items_solicitud: data ?? [] } : s)
    )
    setLoadingItems(null)
    setRespondiendo(solId)
  }

  async function guardarPrecio(solId: string, itemId: string, precio: number) {
    await supabase
      .from('items_solicitud')
      .update({ precio_unitario: precio })
      .eq('id', itemId)
    setPrecios(prev => ({
      ...prev,
      [solId]: { ...(prev[solId] ?? {}), [itemId]: precio },
    }))
  }

  async function enviarCotizacion(sol: Solicitud) {
    const { error } = await supabase
      .from('solicitudes_materiales')
      .update({ estado: 'cotizada' })
      .eq('id', sol.id)
    if (!error) {
      setSolicitudes(prev =>
        prev.map(s => s.id === sol.id ? { ...s, estado: 'cotizada' } : s)
      )
      // Notificar al carpintero
      await supabase.from('notificaciones').insert({
        usuario_id: sol.carpintero_id,
        tipo: 'sistema',
        titulo: 'Cotización de materiales recibida',
        mensaje: `Un proveedor respondió tu solicitud de materiales.`,
        link: `/licitaciones/${sol.licitacion_id}`,
      })
      setMsg('Cotización enviada correctamente.')
      setRespondiendo(null)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const pendientes = solicitudes.filter(s => s.estado === 'enviada')
  const respondidas = solicitudes.filter(s => s.estado !== 'enviada')

  if (solicitudes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card padding="lg">
          <div className="text-center space-y-3">
            <Package size={36} className="mx-auto text-slate-300" />
            <p className="text-slate-500 font-semibold">No tenés solicitudes de materiales aún</p>
            <p className="text-sm text-slate-400">Cuando un carpintero te envíe una solicitud aparecerá aquí.</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {msg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={14} /> {msg}
        </div>
      )}

      {pendientes.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
            Pendientes de respuesta ({pendientes.length})
          </h2>
          <div className="space-y-3">
            {pendientes.map(sol => (
              <SolicitudCard
                key={sol.id}
                sol={sol}
                abierta={respondiendo === sol.id}
                loadingItems={loadingItems === sol.id}
                onToggle={() => cargarItems(sol.id)}
                onGuardarPrecio={(itemId, precio) => guardarPrecio(sol.id, itemId, precio)}
                onEnviarCotizacion={() => enviarCotizacion(sol)}
              />
            ))}
          </div>
        </section>
      )}

      {respondidas.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
            Historial ({respondidas.length})
          </h2>
          <div className="space-y-3">
            {respondidas.map(sol => (
              <SolicitudCard
                key={sol.id}
                sol={sol}
                abierta={respondiendo === sol.id}
                loadingItems={loadingItems === sol.id}
                onToggle={() => cargarItems(sol.id)}
                onGuardarPrecio={(itemId, precio) => guardarPrecio(sol.id, itemId, precio)}
                onEnviarCotizacion={() => enviarCotizacion(sol)}
                readonly
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SolicitudCard({
  sol,
  abierta,
  loadingItems,
  onToggle,
  onGuardarPrecio,
  onEnviarCotizacion,
  readonly = false,
}: {
  sol: Solicitud
  abierta: boolean
  loadingItems: boolean
  onToggle: () => void
  onGuardarPrecio: (itemId: string, precio: number) => Promise<void>
  onEnviarCotizacion: () => void
  readonly?: boolean
}) {
  const estadoConfig = ESTADO_BADGE[sol.estado] ?? { label: sol.estado, variant: 'neutral' as BadgeVariant }
  const licitacionTitulo = (sol.licitaciones as { titulo: string } | null)?.titulo ?? '—'
  const carpinteroNombre = (sol.perfiles as { nombre: string } | null)?.nombre ?? '—'
  const items: ItemSolicitud[] = sol.items_solicitud ?? []

  return (
    <Card padding="none">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate">{licitacionTitulo}</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Carpintero: <span className="font-semibold">{carpinteroNombre}</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(sol.created_at).toLocaleDateString('es-AR')}
          </p>
        </div>
        <div className="ml-4 flex flex-col items-end gap-2 shrink-0">
          <Badge variant={estadoConfig.variant} size="sm">{estadoConfig.label}</Badge>
          <span className="text-xs text-[var(--primary)] font-semibold">
            {abierta ? 'Cerrar ▲' : 'Ver ítems ▼'}
          </span>
        </div>
      </button>

      {abierta && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {loadingItems ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Cargando ítems...
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-400">Sin ítems.</p>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      {item.descripcion} <span className="text-slate-400 font-normal">× {item.cantidad}</span>
                    </span>
                  </div>
                  {!readonly && sol.estado === 'enviada' ? (
                    <ItemPrecioForm
                      item={item}
                      onGuardar={(itemId, precio) => onGuardarPrecio(itemId, precio)}
                    />
                  ) : item.precio_unitario != null ? (
                    <p className="text-xs text-green-700 font-semibold">
                      {formatARS(item.precio_unitario)} c/u — Total: {formatARS(item.precio_unitario * item.cantidad)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Sin precio</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {!readonly && sol.estado === 'enviada' && items.length > 0 && (
            <button
              onClick={onEnviarCotizacion}
              className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-mid)] text-white font-bold text-sm rounded-xl transition-colors mt-2"
            >
              Enviar cotización al carpintero
            </button>
          )}
        </div>
      )}
    </Card>
  )
}
