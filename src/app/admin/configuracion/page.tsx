import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ConfigAdmin from './ConfigAdmin'
import type { Perfil } from '@/types/perfil'
import type { ConfigPlataforma } from '@/types/licitacion'

export default async function AdminConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const { data: config } = await supabase
    .from('config_plataforma')
    .select('*')
    .eq('id', 1)
    .single()

  return (
    <AppShell perfil={perfil as Perfil} pageTitle="Configuración">
      <ConfigAdmin config={config as ConfigPlataforma} />
    </AppShell>
  )
}
