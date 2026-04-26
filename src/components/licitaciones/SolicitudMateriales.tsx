'use client'
import { useState } from 'react'
import { Package, Plus, Trash2, Send } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import type { Licitacion, SolicitudMaterial, ItemSolicitud } from '@/types/licitacion'
import type { Perfil } from '@/types/perfil'

interface Props {
  licitacion: Licitacion
  perfil: Perfil
  proveedores: Perfil[]
  carpinteroElegidoId: string | null
}

interface ItemForm {
  descripcion: string
  cantidad: number
}

const ESTADO_SOLICITUD: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'info' }> = {
  borrador: { label: 'Borrador', variant: 'neutral' },
  enviada: { label: 'Enviada', variant: 'warning' },
  cotizada: { label: 'Cotizada', variant: 'info' },
  aprobada: { label: 'Aprobada', variant: 'success' },
  entregada: { label: 'Entregada', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'neutral' },
}

export default function SolicitudMateriales({ licitacion, perfil, proveedores, carpinteroElegidoId }: Props) {
  const [modal, setModal] = useState(false)
  const [proveedorId, setProveedorId] = useState('')
  const [items, setItems] = useState<ItemForm[]>([{ descripcion: '', cantidad: 1 }])
  const [loading, setLoading] = useState(false)
  const [solicitudes, setSolicitudes] = useState<(SolicitudMaterial & { items: ItemSolicitud[]; proveedor_nombre?: string })[]>([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const supabase = createClient()

  const isCarpinteroAdj = perfil.id === carpinteroElegidoId

  const cargarSolicitudes = async () => {
    if (loaded) return
    setLoadingSolicitudes(true)
    const { data } = await supabase
      .from('solicitudes_materiales')
      .select('*, items_solicitud(*)')
      .eq('carpintero_id', perfil.id)
      .eq('licitacion_id', licitacion.id)
      .order('created_at', { ascending: false })
    setSolicitudes(
      (data ?? []).map((s: SolicitudMaterial & { items_solicitud: ItemSolicitud[] }) => ({
        ...s,
        items: s.items_solicitud ?? [],
        proveedor_nombre: proveedores.find(p => p.id === s.proveedor_id)?.nombre,
      }))
    )
    setLoaded(true)
    setLoadingSolicitudes(false)
  }

  const handleAbrirModal = () => {
    cargarSolicitudes()
    setModal(true)
  }

  const addItem = () => setItems(prev => [...prev, { descripcion: '', cantidad: 1 }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: keyof ItemForm, value: string | number) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))

  const handleEnviar = async () => {
    if (!proveedorId || items.some(i => !i.descripcion.trim())) return
    setLoading(true)
    setError('')

    const { data: sol, error: solErr } = await supabase
      .from('solicitudes_materiales')
      .insert({
        carpintero_id: perfil.id,
        proveedor_id: proveedorId,
        licitacion_id: licitacion.id,
        estado: 'enviada',
      })
      .select()
      .single()

    if (solErr || !sol) {
      setError(solErr?.message ?? 'Error al crear solicitud')
      setLoading(false)
      return
    }

    const { error: itemsErr } = await supabase.from('items_solicitud').insert(
      items
        .filter(i => i.descripcion.trim())
        .map(i => ({
          solicitud_id: sol.id,
          descripcion: i.descripcion.trim(),
          cantidad: i.cantidad,
        }))
    )

    if (itemsErr) {
      setError(itemsErr.message)
      setLoading(false)
      return
    }

    await supabase.from('notificaciones').insert({
      usuario_id: proveedorId,
      tipo: 'sistema',
      titulo: 'Nueva solicitud de materiales',
      mensaje: `${perfil.nombre} solicita cotización de materiales para una obra.`,
      link: `/solicitudes`,
    })

    setModal(false)
    setProveedorId('')
    setItems([{ descripcion: '', cantidad: 1 }])
    setLoaded(false)
    cargarSolicitudes()
    setLoading(false)
  }

  if (!isCarpinteroAdj) return null

  return (
    <div className="bg-[var(--card)] rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-[var(--primary)]" />
          <h3 className="font-bold text-slate-800">Solicitud de materiales</h3>
        </div>
        <Button size="sm" variant="outline" onClick={handleAbrirModal}>
          <Plus size={13} /> Nueva solicitud
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        Pedí precios a un proveedor registrado antes de hacer las compras.
      </p>

      {loadingSolicitudes && (
        <p className="text-sm text-slate-400 text-center">Cargando solicitudes...</p>
      )}

      {solicitudes.map(sol => (
        <div
          key={sol.id}
          className={`rounded-xl p-4 border text-sm ${
            sol.estado === 'cotizada' || sol.estado === 'aprobada'
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-700">{sol.proveedor_nombre ?? 'Proveedor'}</span>
            <Badge
              variant={ESTADO_SOLICITUD[sol.estado]?.variant ?? 'neutral'}
              size="sm"
            >
              {ESTADO_SOLICITUD[sol.estado]?.label ?? sol.estado}
            </Badge>
          </div>
          <div className="space-y-1">
            {sol.items.map(item => (
              <div key={item.id} className="flex justify-between text-xs text-slate-600">
                <span>{item.descripcion} × {item.cantidad}</span>
                {item.precio_unitario && (
                  <span className="font-semibold">
                    ${(item.precio_unitario * item.cantidad).toLocaleString('es-AR')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva solicitud de materiales" size="md">
        <div className="space-y-4">
          {error && (
            <p className="text-sm text-[var(--danger)] bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Proveedor
            </label>
            <select
              value={proveedorId}
              onChange={e => setProveedorId(e.target.value)}
              className="w-full bg-[var(--surface)] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">Seleccioná un proveedor</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}{p.empresa ? ` — ${p.empresa}` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ítems
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-[var(--primary)] font-semibold hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Agregar ítem
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                  placeholder="Descripción del material"
                  className="flex-1 bg-[var(--surface)] border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <input
                  type="number"
                  value={item.cantidad}
                  onChange={e => updateItem(idx, 'cantidad', Number(e.target.value))}
                  min="1"
                  className="w-16 bg-[var(--surface)] border border-slate-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-slate-400 hover:text-[var(--danger)] transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleEnviar}
            loading={loading}
            disabled={!proveedorId || items.every(i => !i.descripcion.trim())}
            className="w-full"
          >
            <Send size={14} /> Enviar solicitud
          </Button>
        </div>
      </Modal>
    </div>
  )
}
