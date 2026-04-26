'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { Perfil, Rol } from '@/types/perfil'

interface Props {
  usuarios: Perfil[]
  page: number
  totalPages: number
  filters: { rol?: string; activo?: string; q?: string }
}

const ROL_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: 'carpintero', label: 'Carpintero' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'admin', label: 'Admin' },
]

const ACTIVO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

export default function UsuariosAdmin({ usuarios, page, totalPages, filters }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const supabase = createClient()

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    const merged = { rol: filters.rol ?? '', activo: filters.activo ?? '', q: filters.q ?? '', page: String(page), ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v) })
    return `/admin/usuarios?${p.toString()}`
  }

  async function toggleActivo(u: Perfil) {
    setLoading(u.id)
    await supabase.from('perfiles').update({ activo: !u.activo }).eq('id', u.id)
    setMsg(`Usuario ${u.nombre} ${!u.activo ? 'activado' : 'desactivado'}.`)
    router.refresh()
    setLoading(null)
  }

  async function cambiarRol(u: Perfil, nuevoRol: Rol) {
    setLoading(u.id + '_rol')
    await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', u.id)
    setMsg(`Rol de ${u.nombre} cambiado a ${nuevoRol}.`)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Filtros */}
      <Card padding="md">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Buscar por nombre..."
            defaultValue={filters.q ?? ''}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                router.push(buildUrl({ q: (e.target as HTMLInputElement).value, page: '0' }))
              }
            }}
            className="flex-1 min-w-40"
          />
          <Select
            value={filters.rol ?? ''}
            onChange={e => router.push(buildUrl({ rol: e.target.value, page: '0' }))}
            options={ROL_OPTIONS}
          />
          <Select
            value={filters.activo ?? ''}
            onChange={e => router.push(buildUrl({ activo: e.target.value, page: '0' }))}
            options={ACTIVO_OPTIONS}
          />
        </div>
      </Card>

      {msg && (
        <p className="text-sm text-[var(--success)] bg-green-50 rounded-xl px-3 py-2">{msg}</p>
      )}

      {/* Tabla */}
      <Card padding="none">
        {usuarios.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No se encontraron usuarios.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left p-4 font-semibold text-slate-600">Nombre</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Email</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Rol</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Estado</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Registrado</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">{u.nombre}</td>
                    <td className="p-4 text-slate-500 text-xs">{u.email ?? '—'}</td>
                    <td className="p-4">
                      <select
                        value={u.rol}
                        onChange={e => cambiarRol(u, e.target.value as Rol)}
                        disabled={loading === u.id + '_rol'}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                      >
                        {ROL_OPTIONS.filter(o => o.value).map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <Badge variant={u.activo ? 'success' : 'neutral'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant={u.activo ? 'danger' : 'outline'}
                        loading={loading === u.id}
                        onClick={() => toggleActivo(u)}
                        className="flex items-center gap-1"
                      >
                        {u.activo ? <><XCircle size={12} /> Desactivar</> : <><CheckCircle size={12} /> Activar</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={page === 0}
            onClick={() => router.push(buildUrl({ page: String(page - 1) }))}
          >
            Anterior
          </Button>
          <span className="text-sm text-slate-500">Página {page + 1} de {totalPages}</span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= totalPages - 1}
            onClick={() => router.push(buildUrl({ page: String(page + 1) }))}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
