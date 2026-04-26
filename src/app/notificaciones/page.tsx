import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import NotificacionesClient from './NotificacionesClient'
import type { Perfil } from '@/types/perfil'
import type { Notificacion } from '@/types/licitacion'
import { contarNotificacionesNoLeidas } from '@/lib/licitaciones'

const TIPO_ICONO: Record<string, string> = {
  cotizacion: '💬',
  pago: '💰',
  etapa: '📋',
  sistema: 'ℹ️',
  mensaje: '✉️',
}

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [perfilRes, notifRes, notifCount] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', user.id).single(),
    supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    contarNotificacionesNoLeidas(user.id, supabase),
  ])

  const perfil = perfilRes.data as Perfil | null
  const notificaciones = (notifRes.data ?? []) as Notificacion[]

  return (
    <AppShell perfil={perfil} pageTitle="Notificaciones" notifCount={notifCount}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-800">Notificaciones</h1>
            <p className="text-sm text-slate-500">
              {notificaciones.filter(n => !n.leida).length} sin leer
            </p>
          </div>
        </div>

        <NotificacionesClient notificaciones={notificaciones} userId={user.id} />
      </div>
    </AppShell>
  )
}
