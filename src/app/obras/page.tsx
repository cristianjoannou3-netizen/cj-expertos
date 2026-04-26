'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import type { Perfil } from '@/types/perfil'
import type { BadgeVariant } from '@/components/ui/Badge'
import { Building2, MapPin, Ruler } from 'lucide-react'

interface Obra {
  id: string
  titulo: string
  estado: string
  cliente_nombre: string | null
  cliente_ubicacion: string | null
  ancho_mm: number | null
  alto_mm: number | null
  monto_presupuestado: number | null
  foto_url: string | null
  tipo_abertura: string | null
  created_at: string
}

const ESTADO_META: Record<string, { label: string; variant: BadgeVariant }> = {
  presupuesto:  { label: 'Presupuesto',  variant: 'info' },
  acopio:       { label: 'Acopio',       variant: 'warning' },
  fabricacion:  { label: 'Fabricación',  variant: 'warning' },
  instalacion:  { label: 'Instalación',  variant: 'info' },
  completada:   { label: 'Completada',   variant: 'success' },
  cancelada:    { label: 'Cancelada',    variant: 'danger' },
}

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(ESTADO_META).map(([v, m]) => ({ value: v, label: m.label })),
]

export default function ObrasPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const supabase = createClient()

  const cargar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const [{ data: p }, { data: o }] = await Promise.all([
      supabase.from('perfiles').select('*').eq('id', user.id).single(),
      supabase.from('obras').select('*').eq('carpintero_id', user.id).order('created_at', { ascending: false }),
    ])
    setPerfil(p as Perfil)
    setObras((o ?? []) as Obra[])
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { cargar() }, [cargar])

  const obrasFiltradas = obras.filter(o => {
    const matchEstado = !estadoFiltro || o.estado === estadoFiltro
    const q = busqueda.toLowerCase()
    const matchBusq = !q || o.titulo.toLowerCase().includes(q) || (o.cliente_nombre ?? '').toLowerCase().includes(q) || (o.cliente_ubicacion ?? '').toLowerCase().includes(q)
    return matchEstado && matchBusq
  })

  return (
    <AppShell perfil={perfil} pageTitle="Mis Obras">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-800">Mis Obras</h1>
          <Button size="md" onClick={() => router.push('/obras/nueva')}>
            + Nueva obra
          </Button>
        </div>

        {/* Filtros */}
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por título, cliente o dirección..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            <div className="sm:w-52">
              <Select
                options={ESTADO_OPTIONS}
                value={estadoFiltro}
                onChange={e => setEstadoFiltro(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Lista */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">Cargando obras...</div>
        ) : obrasFiltradas.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-8">
              <p className="text-4xl mb-3">🏗️</p>
              <p className="text-slate-500 text-lg mb-4">
                {obras.length === 0 ? 'No tenés obras cargadas todavía' : 'Ninguna obra coincide con los filtros'}
              </p>
              {obras.length === 0 && (
                <Button onClick={() => router.push('/obras/nueva')}>Crear primera obra</Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-3">
            {obrasFiltradas.map(obra => {
              const meta = ESTADO_META[obra.estado] ?? { label: obra.estado, variant: 'neutral' as BadgeVariant }
              return (
                <Link key={obra.id} href={`/obras/${obra.id}`}>
                  <Card hover className="flex items-start gap-4">
                    {/* Miniatura */}
                    <div className="shrink-0 w-20 h-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                      {obra.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={obra.foto_url} alt={obra.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={22} className="text-slate-300" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-800 truncate">{obra.titulo}</h3>
                        <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 space-y-0.5">
                        {obra.cliente_nombre && <p>Cliente: {obra.cliente_nombre}</p>}
                        {obra.cliente_ubicacion && (
                          <p className="flex items-center gap-1"><MapPin size={10} />{obra.cliente_ubicacion}</p>
                        )}
                        {obra.ancho_mm && obra.alto_mm && (
                          <p className="flex items-center gap-1"><Ruler size={10} />{obra.ancho_mm} × {obra.alto_mm} mm</p>
                        )}
                      </div>
                    </div>
                    {/* Monto + fecha */}
                    <div className="text-right shrink-0">
                      {obra.monto_presupuestado != null && obra.monto_presupuestado > 0 && (
                        <p className="font-black text-slate-700">
                          ${obra.monto_presupuestado.toLocaleString('es-AR')}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(obra.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
