import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import type { BadgeVariant } from '@/components/ui/Badge'
import type { Perfil } from '@/types/perfil'
import type { Licitacion } from '@/types/licitacion'
import { getLicitacionesByCliente, getLicitacionesParaCarpintero, contarNotificacionesNoLeidas } from '@/lib/licitaciones'

const ESTADO_BADGE: Record<string, BadgeVariant> = {
  abierta: 'info',
  adjudicada: 'warning',
  en_curso: 'warning',
  completada: 'success',
  vencida: 'neutral',
  cancelada: 'danger',
}

const ESTADO_LABEL: Record<string, string> = {
  abierta: 'Abierta',
  adjudicada: 'Adjudicada',
  en_curso: 'En curso',
  completada: 'Completada',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
}

const TIPO_LABEL: Record<string, string> = {
  solo_fabricacion: '🏭 Solo fabricación',
  entrega: '🚛 Con entrega',
  colocacion: '🔧 Entrega + colocación',
}

function CountdownDisplay({ venceEn }: { venceEn: string | null }) {
  if (!venceEn) return null
  const diff = new Date(venceEn).getTime() - Date.now()
  if (diff <= 0) return <span className="text-xs text-slate-400">Vencida</span>
  const h = Math.floor(diff / 3600000)
  if (h > 24) {
    const d = Math.floor(h / 24)
    return <span className="text-xs text-amber-600">Vence en {d}d</span>
  }
  return <span className="text-xs text-amber-600">Vence en {h}h</span>
}

function LicitacionCard({ lic, cotizacionesCount }: { lic: Licitacion; cotizacionesCount: number }) {
  return (
    <Link
      href={`/licitaciones/${lic.id}`}
      className="flex items-start justify-between p-4 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="font-bold text-slate-800 group-hover:text-[var(--primary)] transition-colors">
            {lic.titulo}
          </p>
          <Badge variant={ESTADO_BADGE[lic.estado] ?? 'neutral'} size="sm">
            {ESTADO_LABEL[lic.estado] ?? lic.estado}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
          {lic.tipo_servicio && (
            <span>{TIPO_LABEL[lic.tipo_servicio] ?? lic.tipo_servicio}</span>
          )}
          <span>{new Date(lic.created_at).toLocaleDateString('es-AR')}</span>
          {lic.estado === 'abierta' && <CountdownDisplay venceEn={lic.vence_en} />}
        </div>
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className="text-lg font-black text-[var(--primary)]">{cotizacionesCount}</p>
        <p className="text-xs text-slate-400">cotizaciones</p>
      </div>
    </Link>
  )
}

export default async function LicitacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Perfil y notificaciones en paralelo
  const [perfilRes, notifCount] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', user.id).single(),
    contarNotificacionesNoLeidas(user.id, supabase),
  ])
  const perfil = perfilRes.data as Perfil | null

  const rol = perfil?.rol ?? 'carpintero'

  let licitaciones: (Licitacion & { cotizaciones_count: number })[] = []

  if (rol === 'cliente') {
    licitaciones = await getLicitacionesByCliente(user.id, supabase)
  } else if (rol === 'carpintero') {
    licitaciones = await getLicitacionesParaCarpintero(user.id, supabase)
  }

  const abiertas = licitaciones.filter(l => l.estado === 'abierta')
  const enCurso = licitaciones.filter(l => ['adjudicada', 'en_curso'].includes(l.estado))
  const historial = licitaciones.filter(l => ['completada', 'vencida', 'cancelada'].includes(l.estado))

  return (
    <AppShell perfil={perfil} pageTitle="Licitaciones" notifCount={notifCount}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-800">
              {rol === 'cliente' ? 'Mis licitaciones' : 'Licitaciones disponibles'}
            </h1>
            <p className="text-sm text-slate-500">
              {licitaciones.length} licitación(es) en total
            </p>
          </div>
          {rol === 'cliente' && (
            <Link
              href="/licitaciones/nueva"
              className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-mid)] text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Plus size={16} /> Nueva licitación
            </Link>
          )}
        </div>

        {licitaciones.length === 0 ? (
          <Card padding="lg">
            <div className="text-center space-y-4">
              <p className="text-slate-400 text-lg">No hay licitaciones aún</p>
              {rol === 'cliente' && (
                <Link
                  href="/licitaciones/nueva"
                  className="inline-block bg-[var(--primary)] text-white font-bold px-6 py-3 rounded-xl hover:bg-[var(--primary-mid)] transition-colors"
                >
                  Crear primera licitación
                </Link>
              )}
              {rol === 'carpintero' && (
                <p className="text-sm text-slate-400">Las licitaciones abiertas aparecerán aquí.</p>
              )}
            </div>
          </Card>
        ) : (
          <>
            {abiertas.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Abiertas ({abiertas.length})
                </h2>
                <Card padding="none">
                  {abiertas.map((lic, i) => (
                    <div key={lic.id} className={i !== 0 ? 'border-t border-slate-100' : ''}>
                      <LicitacionCard lic={lic} cotizacionesCount={lic.cotizaciones_count} />
                    </div>
                  ))}
                </Card>
              </section>
            )}

            {enCurso.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                  En curso ({enCurso.length})
                </h2>
                <Card padding="none">
                  {enCurso.map((lic, i) => (
                    <div key={lic.id} className={i !== 0 ? 'border-t border-slate-100' : ''}>
                      <LicitacionCard lic={lic} cotizacionesCount={lic.cotizaciones_count} />
                    </div>
                  ))}
                </Card>
              </section>
            )}

            {historial.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Historial ({historial.length})
                </h2>
                <Card padding="none">
                  {historial.map((lic, i) => (
                    <div key={lic.id} className={i !== 0 ? 'border-t border-slate-100' : ''}>
                      <LicitacionCard lic={lic} cotizacionesCount={lic.cotizaciones_count} />
                    </div>
                  ))}
                </Card>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
