'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import type { Licitacion } from '@/types/licitacion'

type LicitacionConCliente = Licitacion & { perfiles: { nombre: string } }

interface Props {
  licitaciones: LicitacionConCliente[]
  page: number
  totalPages: number
  filters: { estado?: string; q?: string }
}

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'abierta', label: 'Abierta' },
  { value: 'adjudicada', label: 'Adjudicada' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'completada', label: 'Completada' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'cancelada', label: 'Cancelada' },
]

const ESTADO_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  abierta:    'info',
  adjudicada: 'warning',
  en_curso:   'warning',
  completada: 'success',
  vencida:    'neutral',
  cancelada:  'danger',
}

export default function LicitacionesAdmin({ licitaciones, page, totalPages, filters }: Props) {
  const router = useRouter()

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    const merged = { estado: filters.estado ?? '', q: filters.q ?? '', page: String(page), ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v) })
    return `/admin/licitaciones?${p.toString()}`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Card padding="md">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Buscar por título..."
            defaultValue={filters.q ?? ''}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                router.push(buildUrl({ q: (e.target as HTMLInputElement).value, page: '0' }))
              }
            }}
            className="flex-1 min-w-40"
          />
          <Select
            value={filters.estado ?? ''}
            onChange={e => router.push(buildUrl({ estado: e.target.value, page: '0' }))}
            options={ESTADO_OPTIONS}
          />
        </div>
      </Card>

      <Card padding="none">
        {licitaciones.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No se encontraron licitaciones.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left p-4 font-semibold text-slate-600">Título</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Cliente</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Estado</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Fecha</th>
                  <th className="text-left p-4 font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {licitaciones.map(l => (
                  <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800 max-w-xs truncate">{l.titulo}</td>
                    <td className="p-4 text-slate-500 text-xs">{l.perfiles?.nombre ?? '—'}</td>
                    <td className="p-4">
                      <Badge variant={ESTADO_VARIANT[l.estado] ?? 'neutral'}>
                        {l.estado}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(l.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/licitaciones/${l.id}`}
                        className="text-xs font-semibold text-[var(--accent)] hover:underline"
                      >
                        Ver detalle
                      </Link>
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
