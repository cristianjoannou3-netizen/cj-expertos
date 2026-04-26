import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import RangoBadge from '@/components/RangoBadge'
import RangoIcon from '@/components/ui/RangoIcon'
import type { Perfil } from '@/types/perfil'
import { getRank, getProgress } from '@/lib/ranks'
import {
  MapPin, Briefcase, Clock, Users, Maximize2, Star,
  MessageCircle, ShieldCheck, ChevronRight, Award,
  CheckCircle2, Calendar
} from 'lucide-react'

interface Obra {
  id: string
  titulo: string
  tipo_trabajo?: string | null
  foto_url: string | null
  estado: string
  created_at: string
  calificacion: number | null
  cliente_nombre: string | null
  comentario_cliente?: string | null
}

function tiempoAtras(fecha: string): string {
  const diff = (Date.now() - new Date(fecha).getTime()) / 1000
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)}d`
  if (diff < 31536000) return `hace ${Math.floor(diff / 2592000)} mes(es)`
  return `hace ${Math.floor(diff / 31536000)} año(s)`
}

const RANGO_BORDER: Record<string, string> = {
  estrella_1: 'ring-amber-300',
  estrella_2: 'ring-amber-400',
  estrella_3: 'ring-yellow-400',
  estrella_4: 'ring-yellow-500',
  estrella_5: 'ring-amber-500',
  zafiro:     'ring-sky-500',
  rubi:       'ring-red-500',
  esmeralda:  'ring-emerald-500',
  diamante:   'ring-sky-400',
}

export default async function PerfilCarpinteroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [perfilSelfRes, carpinteroRes, obrasRes] = await Promise.all([
    user
      ? supabase.from('perfiles').select('*').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase.from('perfiles').select('*').eq('id', id).eq('rol', 'carpintero').single(),
    supabase.from('obras')
      .select('id, titulo, tipo_trabajo, foto_url, estado, created_at, calificacion, cliente_nombre, comentario_cliente')
      .eq('carpintero_id', id)
      .eq('estado', 'completada')
      .order('created_at', { ascending: false }),
  ])

  if (!carpinteroRes.data) notFound()

  const perfilSelf = perfilSelfRes.data as Perfil | null
  const carpintero = carpinteroRes.data as Perfil
  const obras = ((obrasRes.data ?? []) as Obra[])

  const rank = getRank(carpintero.puntos)
  const progress = getProgress(carpintero.puntos)

  const obrasConFoto = obras.filter(o => o.foto_url)
  const obrasConCalif = obras.filter(o => o.calificacion != null && o.calificacion > 0)
  const obrasConComentario = obrasConCalif.filter(o => o.comentario_cliente?.trim())
  const promedio = obrasConCalif.length > 0
    ? obrasConCalif.reduce((s, o) => s + (o.calificacion ?? 0), 0) / obrasConCalif.length
    : null
  const distribucion = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: obrasConCalif.filter(o => o.calificacion === n).length,
  }))

  const esMiPerfil = user?.id === id
  const ringClass = RANGO_BORDER[carpintero.rango] ?? 'ring-slate-300'

  const especialidades: string[] = carpintero.especialidades ?? []
  const zonas: string[] = carpintero.zonas_cobertura ?? []

  return (
    <AppShell perfil={perfilSelf} pageTitle={carpintero.nombre}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* === HERO SECTION === */}
        <Card>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar con borde de rango */}
            <div className={`ring-4 ${ringClass} rounded-2xl shrink-0 shadow-xl`}>
              <Avatar src={carpintero.avatar_url} name={carpintero.nombre} size="xl" rounded="2xl" />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-black text-slate-800">{carpintero.nombre}</h1>
                {carpintero.verificado && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] bg-[var(--surface)] border border-[var(--accent-light)] px-2 py-0.5 rounded-full">
                    <ShieldCheck size={11} /> Verificado
                  </span>
                )}
                {!carpintero.activo && <Badge variant="danger" size="sm">Inactivo</Badge>}
              </div>

              {/* Rango premium */}
              <div className="flex items-center justify-center sm:justify-start gap-2 my-2">
                <RangoIcon rango={carpintero.rango} size="md" />
                <RangoBadge rango={carpintero.rango} size="md" />
              </div>

              {/* Calificacion y ubicación */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-slate-500">
                {promedio != null && (
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <Star size={13} fill="currentColor" /> {promedio.toFixed(1)} <span className="text-slate-400 font-normal">({obrasConCalif.length} reseñas)</span>
                  </span>
                )}
                {carpintero.ciudad && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {carpintero.ciudad}{carpintero.provincia ? `, ${carpintero.provincia}` : ''}
                  </span>
                )}
              </div>

              {carpintero.bio && (
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{carpintero.bio}</p>
              )}
            </div>
          </div>

          {/* CTA buttons */}
          {!esMiPerfil && (
            <div className="mt-5 flex gap-2 flex-wrap">
              <a href={`/licitaciones/nueva?carpintero=${id}`} className="flex-1">
                <Button variant="primary" className="w-full gap-2">
                  <Briefcase size={15} /> Solicitar presupuesto
                </Button>
              </a>
              {carpintero.telefono && (
                <a
                  href={`https://wa.me/${carpintero.telefono.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-none"
                >
                  <Button variant="outline" className="gap-2">
                    <MessageCircle size={15} className="text-green-500" />
                    WhatsApp
                  </Button>
                </a>
              )}
            </div>
          )}
          {esMiPerfil && (
            <div className="mt-4">
              <a href="/perfil/editar">
                <Button variant="outline" className="w-full">Editar mi perfil</Button>
              </a>
            </div>
          )}
        </Card>

        {/* === ESTADÍSTICAS DE CONFIANZA === */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: <CheckCircle2 size={20} className="text-[var(--success)]" />,
              value: obras.length,
              label: 'Obras completadas',
              sub: null,
            },
            {
              icon: <Star size={20} className="text-amber-500" fill="currentColor" />,
              value: promedio != null ? promedio.toFixed(1) : '—',
              label: 'Calificación',
              sub: obrasConCalif.length > 0 ? `${obrasConCalif.length} reseñas` : null,
            },
            {
              icon: <Clock size={20} className="text-[var(--accent)]" />,
              value: carpintero.experiencia ? `${carpintero.experiencia}` : '—',
              label: 'Años experiencia',
              sub: null,
            },
            {
              icon: <Users size={20} className="text-purple-500" />,
              value: carpintero.empleados ?? '—',
              label: 'Empleados',
              sub: null,
            },
          ].map((s, i) => (
            <div key={i} className="bg-[var(--card)] rounded-2xl border border-slate-100 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
              {s.sub && <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Progreso al siguiente rango */}
        {rank.siguiente && (
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <Award size={16} className="text-[var(--accent)]" />
              <span className="text-sm font-bold text-slate-700">Progreso al siguiente rango</span>
              <span className="text-xs text-slate-500">{rank.siguiente.nombre}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{progress.puntosActuales} pts</span>
              <span>{rank.siguiente.minPuntos} pts</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{ width: `${progress.porcentaje}%`, backgroundColor: rank.siguiente.color }}
              />
            </div>
          </Card>
        )}

        {/* === ESPECIALIDADES === */}
        {especialidades.length > 0 && (
          <Card header="Especialidades">
            <div className="flex flex-wrap gap-2">
              {especialidades.map((esp, i) => (
                <span key={i} className="text-sm font-medium px-3 py-1.5 bg-[var(--surface)] text-[var(--primary)] border border-[var(--accent-light)] rounded-full hover:bg-[var(--accent-light)] transition-colors cursor-default">
                  {esp}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* === DETALLES DEL TALLER === */}
        {(carpintero.m2_taller || carpintero.empleados) && (
          <Card header="Taller">
            <div className="grid grid-cols-2 gap-4">
              {carpintero.m2_taller && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Maximize2 size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-800">{carpintero.m2_taller} m²</p>
                    <p className="text-xs text-slate-400">Superficie</p>
                  </div>
                </div>
              )}
              {carpintero.empleados != null && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-800">{carpintero.empleados}</p>
                    <p className="text-xs text-slate-400">Empleados</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* === ZONA DE COBERTURA === */}
        {zonas.length > 0 && (
          <Card header="Zona de cobertura">
            <div className="flex flex-wrap gap-2">
              {zonas.map((zona, i) => (
                <span key={i} className="text-sm font-medium px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full flex items-center gap-1.5">
                  <MapPin size={12} className="text-[var(--accent)]" /> {zona}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* === PORTAFOLIO DE OBRAS (fotos) === */}
        {obrasConFoto.length > 0 && (
          <Card header={`Portafolio (${obrasConFoto.length} obras)`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {obrasConFoto.slice(0, 6).map(o => (
                <div key={o.id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.foto_url!} alt={o.titulo} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                    <p className="text-white text-xs font-semibold truncate">{o.titulo}</p>
                    {o.tipo_trabajo && <p className="text-white/70 text-[10px] truncate">{o.tipo_trabajo}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* === CALIFICACIONES === */}
        {obrasConCalif.length > 0 && promedio != null && (
          <Card header="Calificaciones">
            <div className="flex items-start gap-6 mb-5">
              <div className="text-center shrink-0">
                <p className="text-5xl font-black text-slate-800">{promedio.toFixed(1)}</p>
                <div className="flex justify-center mt-1.5 gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14}
                      fill={s <= Math.round(promedio) ? '#F59E0B' : 'none'}
                      stroke={s <= Math.round(promedio) ? '#F59E0B' : '#D1D5DB'} />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">{obrasConCalif.length} reseña{obrasConCalif.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {distribucion.map(d => (
                  <div key={d.stars} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-3 font-semibold">{d.stars}</span>
                    <Star size={10} fill="#F59E0B" stroke="#F59E0B" />
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-amber-400 transition-all"
                        style={{ width: obrasConCalif.length ? `${(d.count / obrasConCalif.length) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-xs text-slate-400 w-4">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reseñas */}
            {obrasConComentario.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                {obrasConComentario.slice(0, 5).map(o => (
                  <div key={o.id} className="p-3.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--surface)] flex items-center justify-center">
                          <span className="text-[var(--primary)] text-xs font-black">
                            {(o.cliente_nombre || 'C')[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{o.cliente_nombre || 'Cliente'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={10}
                              fill={s <= (o.calificacion ?? 0) ? '#F59E0B' : 'none'}
                              stroke={s <= (o.calificacion ?? 0) ? '#F59E0B' : '#D1D5DB'} />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400">{tiempoAtras(o.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{o.comentario_cliente}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* === HISTORIAL DE OBRAS === */}
        {obras.length > 0 && (
          <Card header={`Obras completadas (${obras.length})`}>
            <div className="space-y-2">
              {obras.slice(0, 8).map(o => (
                <div key={o.id} className="flex gap-3 items-center p-2.5 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                  {o.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.foto_url} alt={o.titulo} className="w-16 h-12 object-cover rounded-lg shrink-0 group-hover:opacity-90 transition-opacity" />
                  ) : (
                    <div className="w-16 h-12 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center">
                      <Briefcase size={16} className="text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{o.titulo}</p>
                    {o.tipo_trabajo && <p className="text-xs text-[var(--accent)] font-medium truncate">{o.tipo_trabajo}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar size={10} className="text-slate-300" />
                      <p className="text-xs text-slate-400">{tiempoAtras(o.created_at)}</p>
                      {o.calificacion != null && o.calificacion > 0 && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={9}
                              fill={s <= o.calificacion! ? '#F59E0B' : 'none'}
                              stroke={s <= o.calificacion! ? '#F59E0B' : '#D1D5DB'} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {obras.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Sin obras completadas todavía</p>
              <p className="text-sm text-slate-400 mt-1">Las obras aparecerán aquí cuando sean finalizadas.</p>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
