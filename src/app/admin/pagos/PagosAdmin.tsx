'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { createClient } from '@/lib/supabase/client'
import type { Pago } from '@/types/licitacion'

interface Props {
  pagos: Pago[]
  page: number
  totalPages: number
  filters: { estado?: string; metodo?: string }
}

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'rechazado', label: 'Rechazado' },
]

const METODO_OPTIONS = [
  { value: '', label: 'Todos los métodos' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'transferencia', label: 'Transferencia' },
]

const TRAMO_LABELS: Record<number, string> = {
  1: 'Anticipo (40%)',
  2: 'Materiales (60%)',
  3: 'Saldo final',
}

export default function PagosAdmin({ pagos, page, totalPages, filters }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const supabase = createClient()

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    const merged = { estado: filters.estado ?? '', metodo: filters.metodo ?? '', page: String(page), ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v) })
    return `/admin/pagos?${p.toString()}`
  }

  async function handleAccion(pago: Pago, accion: 'confirmado' | 'rechazado') {
    setLoading(pago.id)
    setMsg('')
    const { error } = await supabase.from('pagos').update({ estado: accion }).eq('id', pago.id)
    if (error) {
      setMsg(`Error: ${error.message}`)
    } else {
      if (accion === 'confirmado' && pago.tramo === 2) {
        await supabase.rpc('liberar_60_porciento', { p_licitacion_id: pago.licitacion_id })
      }
      setMsg(`Pago ${accion === 'confirmado' ? 'confirmado' : 'rechazado'} correctamente.`)
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card padding="md">
        <div className="flex flex-wrap gap-3">
          <Select
            value={filters.estado ?? ''}
            onChange={e => router.push(buildUrl({ estado: e.target.value, page: '0' }))}
            options={ESTADO_OPTIONS}
          />
          <Select
            value={filters.metodo ?? ''}
            onChange={e => router.push(buildUrl({ metodo: e.target.value, page: '0' }))}
            options={METODO_OPTIONS}
          />
        </div>
      </Card>

      {msg && (
        <p className="text-sm text-[var(--success)] bg-green-50 rounded-xl px-3 py-2">{msg}</p>
      )}

      <Card padding="none">
        {pagos.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No se encontraron pagos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left p-4 font-semibold text-slate-600">Licitación</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Tramo</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Monto</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Método</th>
                  <th className="text-left p-4 font-semibold text-slate-600">MP ID</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Comprobante</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Estado</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Fecha</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-xs font-mono text-slate-500 max-w-[120px] truncate">
                      {p.licitacion_id.slice(0, 8)}...
                    </td>
                    <td className="p-4 text-xs">{TRAMO_LABELS[p.tramo] ?? `Tramo ${p.tramo}`}</td>
                    <td className="p-4 font-bold text-slate-800">${p.monto.toLocaleString('es-AR')}</td>
                    <td className="p-4 text-xs capitalize">{p.metodo ?? '—'}</td>
                    <td className="p-4 text-xs font-mono text-slate-400">{p.mp_payment_id ?? '—'}</td>
                    <td className="p-4">
                      {p.comprobante_url ? (
                        <a
                          href={p.comprobante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--primary)] hover:text-[var(--primary-mid)] underline"
                        >
                          <Eye size={12} />
                          Ver comprobante
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={p.estado === 'confirmado' ? 'success' : p.estado === 'rechazado' ? 'danger' : 'warning'}>
                        {p.estado}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(p.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="p-4">
                      {p.estado === 'pendiente' && (
                        <div className="flex gap-2 flex-wrap">
                          {p.metodo === 'transferencia' && p.comprobante_url && (
                            <a
                              href={p.comprobante_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline" className="flex items-center gap-1">
                                <Eye size={12} /> Ver
                              </Button>
                            </a>
                          )}
                          <Button size="sm" loading={loading === p.id}
                            onClick={() => handleAccion(p, 'confirmado')}
                            className="flex items-center gap-1">
                            <CheckCircle size={12} /> Confirmar
                          </Button>
                          <Button size="sm" variant="danger" loading={loading === p.id}
                            onClick={() => handleAccion(p, 'rechazado')}
                            className="flex items-center gap-1">
                            <XCircle size={12} /> No
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" variant="ghost" disabled={page === 0}
            onClick={() => router.push(buildUrl({ page: String(page - 1) }))}>
            Anterior
          </Button>
          <span className="text-sm text-slate-500">Página {page + 1} de {totalPages}</span>
          <Button size="sm" variant="ghost" disabled={page >= totalPages - 1}
            onClick={() => router.push(buildUrl({ page: String(page + 1) }))}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
