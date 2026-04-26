import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import type { BadgeVariant } from '@/components/ui/Badge'
import type { Perfil } from '@/types/perfil'
import CambiarEstado from '@/components/CambiarEstado'
import { Phone, MapPin, Ruler, Edit3, Check, Circle } from 'lucide-react'

// ── Etapas (timeline) ──────────────────────────────────────────
const ETAPAS: { id: string; label: string; desc: string }[] = [
  { id: 'presupuesto', label: 'Presupuesto',  desc: 'Medición y presupuesto enviado al cliente' },
  { id: 'acopio',      label: 'Acopio',       desc: 'Anticipo cobrado, materiales a comprar' },
  { id: 'fabricacion', label: 'Fabricación',  desc: 'Elaboración en taller' },
  { id: 'instalacion', label: 'Instalación',  desc: 'Colocación en obra' },
  { id: 'completada',  label: 'Completada',   desc: 'Obra finalizada y cobrada' },
]

const ESTADO_INDEX: Record<string, number> = {
  presupuesto: 0, acopio: 1, fabricacion: 2, instalacion: 3, completada: 4, cancelada: 99,
}

const ESTADO_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  presupuesto:  { label: 'Presupuesto',  variant: 'info' },
  acopio:       { label: 'Acopio',       variant: 'warning' },
  fabricacion:  { label: 'Fabricación',  variant: 'warning' },
  instalacion:  { label: 'Instalación',  variant: 'info' },
  completada:   { label: 'Completada',   variant: 'success' },
  cancelada:    { label: 'Cancelada',    variant: 'danger' },
}

function TimelineVertical({ estadoActual }: { estadoActual: string }) {
  const idx = ESTADO_INDEX[estadoActual] ?? 0
  return (
    <div className="space-y-0">
      {ETAPAS.map((etapa, i) => {
        const done    = i < idx
        const current = i === idx
        const pending = i > idx
        return (
          <div key={etapa.id} className="flex gap-4">
            {/* Línea + círculo */}
            <div className="flex flex-col items-center">
              <div className={[
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors',
                done    ? 'bg-[var(--primary)] border-[var(--primary)] text-white' :
                current ? 'bg-[var(--accent)] border-[var(--accent)] text-white' :
                          'bg-white border-slate-200 text-slate-300',
              ].join(' ')}>
                {done ? <Check size={14} /> : current ? <Circle size={14} fill="currentColor" /> : <Circle size={12} />}
              </div>
              {i < ETAPAS.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-6 my-1 ${done ? 'bg-[var(--primary)]' : 'bg-slate-200'}`} />
              )}
            </div>
            {/* Texto */}
            <div className={`pb-5 flex-1 ${i === ETAPAS.length - 1 ? 'pb-0' : ''}`}>
              <p className={`font-bold text-sm ${done || current ? 'text-slate-800' : 'text-slate-400'}`}>{etapa.label}</p>
              <p className={`text-xs mt-0.5 ${done || current ? 'text-slate-500' : 'text-slate-300'}`}>{etapa.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ESTADOS_CAMBIO = ['presupuesto', 'acopio', 'fabricacion', 'instalacion', 'completada', 'cancelada']

export default async function ObraDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: obra }, { data: perfilData }] = await Promise.all([
    supabase.from('obras').select('*').eq('id', id).eq('carpintero_id', user.id).single(),
    supabase.from('perfiles').select('*').eq('id', user.id).single(),
  ])

  if (!obra) notFound()

  const perfil = perfilData as Perfil | null
  const costos = (obra.costo_aluminio ?? 0) + (obra.costo_vidrio ?? 0) + (obra.costo_accesorios ?? 0)
  const tieneAcopio = obra.monto_acopiado != null && obra.monto_acopiado > 0
  const sobrante = tieneAcopio ? obra.monto_acopiado - costos : null
  const estadoBadge = ESTADO_BADGE[obra.estado] ?? { label: obra.estado, variant: 'neutral' as BadgeVariant }

  return (
    <AppShell perfil={perfil} pageTitle={obra.titulo}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/obras" className="text-xs text-slate-400 hover:text-slate-600 mb-1 block">← Mis Obras</Link>
            <h1 className="text-2xl font-black text-slate-800">{obra.titulo}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
              {obra.tipo_abertura && <Badge variant="neutral">{obra.tipo_abertura}</Badge>}
            </div>
          </div>
          <Link href={`/obras/${obra.id}/editar`}>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline shrink-0">
              <Edit3 size={14} /> Editar
            </span>
          </Link>
        </div>

        {/* Foto */}
        {obra.foto_url && (
          <div className="rounded-2xl overflow-hidden border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={obra.foto_url} alt={obra.titulo} className="w-full h-64 object-cover" />
          </div>
        )}

        {/* Timeline + datos cliente — grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card header="Progreso de la obra">
            <TimelineVertical estadoActual={obra.estado} />
            {obra.estado !== 'cancelada' && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Actualizar estado</p>
                <CambiarEstado obraId={obra.id} estadoActual={obra.estado} estados={ESTADOS_CAMBIO} carpinteroId={user.id} />
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card header="Cliente">
              <p className="font-bold text-slate-800 text-lg">{obra.cliente_nombre || '—'}</p>
              {obra.cliente_telefono && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1.5">
                  <Phone size={13} /> {obra.cliente_telefono}
                </p>
              )}
              {obra.cliente_ubicacion && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin size={13} /> {obra.cliente_ubicacion}
                </p>
              )}
            </Card>

            <Card header="Medidas del vano">
              {obra.ancho_mm && obra.alto_mm ? (
                <div>
                  <p className="text-3xl font-black text-slate-800">
                    {obra.ancho_mm} × {obra.alto_mm}
                    <span className="text-base font-normal text-slate-400 ml-1">mm</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Ruler size={11} />
                    {((obra.ancho_mm * obra.alto_mm) / 1e6).toFixed(2)} m²
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Sin medidas</p>
              )}
            </Card>
          </div>
        </div>

        {/* Financiero */}
        <Card header="Financiero">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Presupuesto total</p>
              <p className="font-black text-lg text-slate-700">
                {obra.monto_presupuestado
                  ? `$${obra.monto_presupuestado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                  : <span className="text-slate-300 text-sm">—</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Acopio cobrado</p>
              <p className="font-black text-lg text-orange-600">
                {tieneAcopio
                  ? `$${obra.monto_acopiado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                  : <span className="text-amber-500 text-sm font-bold">Sin cargar</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Costos materiales</p>
              <p className="font-black text-lg text-red-600">
                {costos > 0
                  ? `$${costos.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                  : <span className="text-slate-300 text-sm">—</span>}
              </p>
            </div>
          </div>

          {sobrante !== null && costos > 0 && (
            <div className={`rounded-xl p-4 border-2 ${sobrante >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">{sobrante >= 0 ? 'Sobrante en caja' : 'Déficit estimado'}</span>
                <span className={`text-2xl font-black ${sobrante >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(sobrante).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Acopio − costos materiales</p>
            </div>
          )}

          {costos > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 text-sm mt-3 space-y-1">
              {obra.costo_aluminio > 0 && <div className="flex justify-between text-slate-600"><span>Aluminio</span><span>${obra.costo_aluminio.toLocaleString('es-AR')}</span></div>}
              {obra.costo_vidrio   > 0 && <div className="flex justify-between text-slate-600"><span>Vidrio</span><span>${obra.costo_vidrio.toLocaleString('es-AR')}</span></div>}
              {obra.costo_accesorios > 0 && <div className="flex justify-between text-slate-600"><span>Accesorios</span><span>${obra.costo_accesorios.toLocaleString('es-AR')}</span></div>}
            </div>
          )}
        </Card>

        {/* Descripción */}
        {obra.descripcion && (
          <Card header="Descripción">
            <p className="text-slate-700 whitespace-pre-wrap text-sm">{obra.descripcion}</p>
          </Card>
        )}

        <p className="text-xs text-slate-400 text-center pt-2">
          Creada: {new Date(obra.created_at).toLocaleDateString('es-AR')} · ID: {obra.id.slice(0, 8)}
        </p>
      </div>
    </AppShell>
  )
}
