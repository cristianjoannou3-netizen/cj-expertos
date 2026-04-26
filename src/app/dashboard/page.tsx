import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import RangoBadge from '@/components/RangoBadge'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import type { Perfil } from '@/types/perfil'

const estadoVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  borrador:    'neutral',
  cotizacion:  'warning',
  acopio:      'warning',
  fabricacion: 'info',
  entrega:     'info',
  colocacion:  'info',
  finalizada:  'success',
  cancelada:   'danger',
}

const estadoLabel: Record<string, string> = {
  borrador:    'Borrador',
  cotizacion:  'Cotización',
  acopio:      'Acopio',
  fabricacion: 'Fabricación',
  entrega:     'Entrega',
  colocacion:  'Colocación',
  finalizada:  'Finalizada',
  cancelada:   'Cancelada',
}

type Obra = {
  id: string
  titulo: string
  estado: string
  cliente_nombre: string | null
  created_at: string
  monto_presupuestado: number
}

// ── Dashboards por rol ────────────────────────────────────

function DashboardCarpintero({ perfil, obras }: { perfil: Perfil; obras: Obra[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-black text-slate-800">{perfil.nombre}</h2>
              <RangoBadge rango={perfil.rango} />
            </div>
            {perfil.empresa && <p className="text-slate-500 text-sm">{perfil.empresa}</p>}
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-center">
            <p className="text-xs font-semibold text-[var(--success)] uppercase tracking-wide">Saldo billetera</p>
            <p className="text-2xl font-black text-[var(--success)]">
              ${(perfil.saldo_billetera || 0).toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total obras',    value: obras.length,                                            color: 'text-[var(--accent)]' },
          { label: 'En fabricación', value: obras.filter(o => o.estado === 'fabricacion').length,    color: 'text-[var(--accent)]' },
          { label: 'Finalizadas',    value: obras.filter(o => o.estado === 'finalizada').length,     color: 'text-[var(--success)]' },
          { label: 'Puntos',         value: perfil.puntos,                                           color: 'text-[var(--warning)]' },
        ].map((m, i) => (
          <Card key={i} padding="md">
            <div className="text-center">
              <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
              <p className="text-xs text-slate-500 mt-1">{m.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/obras/nueva"
          className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-mid)] text-white font-bold px-6 py-3 rounded-xl shadow-sm transition-colors">
          + Nueva obra
        </Link>
        <Link href="/obras"
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-xl border border-slate-200 shadow-sm transition-colors">
          Ver todas las obras
        </Link>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-700 mb-3">Obras recientes</h3>
        {obras.length === 0 ? (
          <Card padding="lg">
            <div className="text-center">
              <p className="text-slate-400 text-lg mb-4">Todavía no cargaste obras</p>
              <Link href="/obras/nueva"
                className="inline-block bg-[var(--primary)] text-white font-bold px-6 py-3 rounded-xl hover:bg-[var(--primary-mid)] transition-colors">
                Crear primera obra
              </Link>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            {obras.map((obra, i) => (
              <Link key={obra.id} href={`/obras/${obra.id}`}
                className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                <div>
                  <p className="font-bold text-slate-800">{obra.titulo}</p>
                  <p className="text-sm text-slate-400">
                    {obra.cliente_nombre || 'Sin cliente'} · {new Date(obra.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {obra.monto_presupuestado > 0 && (
                    <span className="text-sm font-bold text-slate-600">
                      ${obra.monto_presupuestado.toLocaleString('es-AR')}
                    </span>
                  )}
                  <Badge variant={estadoVariant[obra.estado] ?? 'neutral'}>
                    {estadoLabel[obra.estado] ?? obra.estado}
                  </Badge>
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}

function DashboardCliente({ perfil }: { perfil: Perfil }) {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-black text-slate-800 mb-1">Bienvenido, {perfil.nombre}</h2>
        <p className="text-slate-500 text-sm">Publicá licitaciones y encontrá carpinteros de confianza.</p>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Link href="/licitaciones/nueva"
          className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-mid)] text-white font-bold px-6 py-3 rounded-xl shadow-sm transition-colors">
          + Nueva Licitación
        </Link>
        <Link href="/licitaciones"
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-xl border border-slate-200 shadow-sm transition-colors">
          Mis Licitaciones
        </Link>
      </div>
    </div>
  )
}

function DashboardProveedor({ perfil }: { perfil: Perfil }) {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-black text-slate-800 mb-1">Bienvenido, {perfil.nombre}</h2>
        <p className="text-slate-500 text-sm">Gestioná tus solicitudes de materiales.</p>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Link href="/solicitudes"
          className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-mid)] text-white font-bold px-6 py-3 rounded-xl shadow-sm transition-colors">
          Ver Solicitudes
        </Link>
      </div>
    </div>
  )
}

function DashboardAdmin({ perfil }: { perfil: Perfil }) {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-black text-slate-800 mb-1">Panel de Administración</h2>
        <p className="text-slate-500 text-sm">Bienvenido, {perfil.nombre}. Administrá la plataforma.</p>
      </Card>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Usuarios',     href: '/admin/usuarios',     color: 'text-[var(--accent)]' },
          { label: 'Licitaciones', href: '/admin/licitaciones', color: 'text-[var(--accent)]' },
          { label: 'Pagos',        href: '/admin/pagos',        color: 'text-[var(--success)]' },
          { label: 'Comisiones',   href: '/admin/comisiones',   color: 'text-[var(--warning)]' },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <Card hover padding="md">
              <div className="text-center">
                <p className={`text-base font-black ${item.color}`}>{item.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const rol = perfil?.rol ?? 'carpintero'

  const obras: Obra[] = rol === 'carpintero'
    ? ((await supabase
        .from('obras')
        .select('id, titulo, estado, cliente_nombre, created_at, monto_presupuestado')
        .eq('carpintero_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      ).data ?? [])
    : []

  function renderContent() {
    if (!perfil) return <p className="text-slate-500">No se encontró el perfil.</p>
    switch (rol) {
      case 'carpintero': return <DashboardCarpintero perfil={perfil} obras={obras} />
      case 'cliente':    return <DashboardCliente    perfil={perfil} />
      case 'proveedor':  return <DashboardProveedor  perfil={perfil} />
      case 'admin':      return <DashboardAdmin      perfil={perfil} />
      default:           return <DashboardCarpintero perfil={perfil} obras={obras} />
    }
  }

  return (
    <AppShell perfil={perfil} pageTitle="Inicio">
      {renderContent()}
    </AppShell>
  )
}
