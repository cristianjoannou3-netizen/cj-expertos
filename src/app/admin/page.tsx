import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import AdminCharts from './AdminCharts'
import Card from '@/components/ui/Card'
import RangoBadge from '@/components/RangoBadge'
import type { Perfil } from '@/types/perfil'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  // Fecha de corte para últimas 8 semanas
  const hace8semanas = new Date()
  hace8semanas.setDate(hace8semanas.getDate() - 56)

  // Métricas
  const [
    { count: totalLicitaciones },
    { count: licitacionesActivas },
    escrowRes,
    comisionesRes,
    actividadRes,
    estadosRes,
    { count: carpinterosActivos },
    { count: carpinterosTotal },
    cotizacionesRes,
    top5Res,
    licitacionesSemanalesRes,
  ] = await Promise.all([
    supabase.from('licitaciones').select('*', { count: 'exact', head: true }),
    supabase.from('licitaciones').select('*', { count: 'exact', head: true })
      .in('estado', ['abierta', 'adjudicada', 'en_curso']),
    supabase.from('pagos').select('monto')
      .eq('estado', 'confirmado')
      .in('tramo', [1, 2]),
    supabase.from('movimientos').select('monto')
      .eq('tipo', 'comision'),
    supabase.from('movimientos').select('*, perfiles:perfil_id(nombre)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('licitaciones').select('estado'),
    supabase.from('perfiles').select('*', { count: 'exact', head: true })
      .eq('rol', 'carpintero').eq('activo', true),
    supabase.from('perfiles').select('*', { count: 'exact', head: true })
      .eq('rol', 'carpintero'),
    supabase.from('cotizaciones').select('licitacion_id'),
    supabase.from('perfiles').select('id,nombre,rango,puntos')
      .eq('rol', 'carpintero').order('puntos', { ascending: false }).limit(5),
    supabase.from('licitaciones').select('created_at')
      .gte('created_at', hace8semanas.toISOString()),
  ])

  const montoEscrow = (escrowRes.data ?? []).reduce((s: number, p: { monto: number }) => s + p.monto, 0)
  const totalComisiones = (comisionesRes.data ?? []).reduce((s: number, m: { monto: number }) => s + m.monto, 0)

  // Distribución por estado para gráfico
  const estadoCount: Record<string, number> = {}
  for (const l of (estadosRes.data ?? [])) {
    estadoCount[l.estado] = (estadoCount[l.estado] ?? 0) + 1
  }
  const chartEstados = Object.entries(estadoCount).map(([estado, cantidad]) => ({ estado, cantidad }))

  // Promedio cotizaciones por licitacion
  const cotsByLic: Record<string, number> = {}
  for (const c of (cotizacionesRes.data ?? [])) {
    cotsByLic[c.licitacion_id] = (cotsByLic[c.licitacion_id] ?? 0) + 1
  }
  const licIds = Object.keys(cotsByLic)
  const promCotizaciones = licIds.length > 0
    ? Math.round((Object.values(cotsByLic).reduce((a, b) => a + b, 0) / licIds.length) * 10) / 10
    : 0

  // Licitaciones por semana (últimas 8 semanas)
  const semanas: { semana: string; cantidad: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - (i + 1) * 7)
    const fin = new Date()
    fin.setDate(fin.getDate() - i * 7)
    const count = (licitacionesSemanalesRes.data ?? []).filter(l => {
      const d = new Date(l.created_at)
      return d >= inicio && d < fin
    }).length
    const label = `S-${i === 0 ? 'hoy' : i}`
    semanas.push({ semana: label, cantidad: count })
  }

  return (
    <AppShell perfil={perfil as Perfil} pageTitle="Panel Admin">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Métricas principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total licitaciones', value: totalLicitaciones ?? 0, color: 'text-[var(--accent)]' },
            { label: 'Licitaciones activas', value: licitacionesActivas ?? 0, color: 'text-[var(--accent)]' },
            { label: 'Monto en escrow', value: `$${montoEscrow.toLocaleString('es-AR')}`, color: 'text-[var(--success)]' },
            { label: 'Comisiones cobradas', value: `$${totalComisiones.toLocaleString('es-AR')}`, color: 'text-amber-600' },
          ].map((m, i) => (
            <Card key={i} padding="md">
              <div className="text-center">
                <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                <p className="text-xs text-slate-500 mt-1">{m.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Métricas adicionales */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card padding="md">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Carpinteros activos</p>
            <p className="text-2xl font-black text-slate-800">
              {carpinterosActivos ?? 0}
              <span className="text-sm font-normal text-slate-400"> / {carpinterosTotal ?? 0}</span>
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Prom. cotizaciones/lic.</p>
            <p className="text-2xl font-black text-slate-800">{promCotizaciones}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Lics. últimas 8 sem.</p>
            <p className="text-2xl font-black text-slate-800">
              {(licitacionesSemanalesRes.data ?? []).length}
            </p>
          </Card>
        </div>

        {/* Gráficos */}
        <AdminCharts chartEstados={chartEstados} licitacionesPorSemana={semanas} />

        {/* Top 5 carpinteros */}
        <div>
          <h3 className="text-base font-bold text-slate-700 mb-3">Top 5 carpinteros por puntos</h3>
          <Card padding="none">
            {(top5Res.data ?? []).length === 0 ? (
              <p className="text-slate-400 text-center py-6 text-sm">Sin datos</p>
            ) : (
              (top5Res.data ?? []).map((c: { id: string; nombre: string; rango: string; puntos: number }, i: number) => (
                <div key={c.id} className={`flex items-center gap-3 p-4 ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                  <span className="w-6 text-center text-sm font-black text-slate-400">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{c.nombre}</p>
                    <RangoBadge rango={c.rango} />
                  </div>
                  <span className="font-black text-[var(--primary)]">{c.puntos} pts</span>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* Actividad reciente */}
        <div>
          <h3 className="text-base font-bold text-slate-700 mb-3">Actividad reciente</h3>
          <Card padding="none">
            {(actividadRes.data ?? []).length === 0 ? (
              <p className="text-slate-400 text-center py-6">Sin actividad reciente</p>
            ) : (
              (actividadRes.data ?? []).map((m: {
                id: string; tipo: string; monto: number; descripcion: string | null; created_at: string;
                perfiles: { nombre: string } | null
              }, i: number) => (
                <div key={m.id} className={`flex items-center justify-between p-4 ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 truncate max-w-xs">
                      {m.descripcion ?? m.tipo}
                    </p>
                    <p className="text-xs text-slate-400">
                      {m.perfiles?.nombre ?? 'Usuario'} · {new Date(m.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <span className={`font-black text-sm ${m.tipo === 'credito' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {m.tipo === 'debito' ? '-' : '+'}${m.monto.toLocaleString('es-AR')}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
