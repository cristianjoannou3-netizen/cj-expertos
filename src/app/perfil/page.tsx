import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import EditarPerfilForm from '@/components/EditarPerfilForm'
import MercadoPagoConnect from '@/components/MercadoPagoConnect'
import RangoBadge from '@/components/RangoBadge'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import { Wallet } from 'lucide-react'
import type { Perfil } from '@/types/perfil'

const TIPO_COLOR: Record<string, string> = {
  credito:  'bg-green-100 text-green-700',
  debito:   'bg-red-100 text-red-700',
  comision: 'bg-orange-100 text-orange-700',
  retiro:   'bg-slate-100 text-slate-600',
  deposito: 'bg-sky-100 text-sky-700',
}

const TIPO_SIGNO: Record<string, string> = {
  credito:  '+',
  deposito: '+',
  debito:   '-',
  comision: '-',
  retiro:   '-',
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [perfilRes, movimientosRes] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', user.id).single(),
    supabase.from('movimientos')
      .select('*')
      .eq('perfil_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const perfil = perfilRes.data as Perfil | null
  const movimientos = movimientosRes.data ?? []

  return (
    <AppShell perfil={perfil} pageTitle="Mi perfil">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Cabecera del perfil */}
        <Card>
          <div className="flex items-center gap-4">
            <Avatar src={perfil?.avatar_url} name={perfil?.nombre} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-slate-800">{perfil?.nombre || 'Sin nombre'}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <RangoBadge rango={perfil?.rango || 'estrella_1'} />
                <span className="text-sm text-slate-400">{perfil?.puntos || 0} puntos</span>
                {perfil?.verificado && (
                  <span className="text-xs text-[var(--accent)] bg-[var(--surface)] border border-[var(--accent-light)] px-2 py-0.5 rounded-full font-semibold">
                    ✓ Verificado
                  </span>
                )}
              </div>
              {perfil?.ciudad && (
                <p className="text-xs text-slate-400 mt-0.5">{perfil.ciudad}{perfil.provincia ? `, ${perfil.provincia}` : ''}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Saldo billetera */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Wallet size={20} className="text-[var(--success)]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Saldo billetera</p>
              <p className="text-3xl font-black text-[var(--success)]">
                ${(perfil?.saldo_billetera || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        {/* Formulario edición */}
        <EditarPerfilForm perfil={perfil} userId={user.id} />

        {/* Vincular Mercado Pago — solo para carpinteros */}
        {perfil?.rol === 'carpintero' && (
          <Card>
            <Suspense fallback={null}>
              <MercadoPagoConnect perfil={perfil} />
            </Suspense>
          </Card>
        )}

        {/* Historial de movimientos */}
        <Card header="Historial de movimientos" padding="none">
          {movimientos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No hay movimientos registrados todavía.</p>
              <p className="text-sm text-slate-300 mt-1">Se registrarán cuando finalices una obra.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {movimientos.map(mov => {
                const signo = TIPO_SIGNO[mov.tipo] || ''
                const colorClass = TIPO_COLOR[mov.tipo] || 'bg-slate-100 text-slate-600'
                const esPositivo = signo === '+'
                return (
                  <div key={mov.id} className="flex items-start justify-between p-4 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
                          {mov.tipo}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{mov.descripcion || '—'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(mov.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <p className={`font-black text-lg shrink-0 ${esPositivo ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {signo}${Number(mov.monto).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

      </div>
    </AppShell>
  )
}
