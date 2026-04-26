import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ComisionesAdmin from './ComisionesAdmin'
import type { Perfil } from '@/types/perfil'
import type { Movimiento } from '@/types/licitacion'

export default async function AdminComisionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const { data: comisiones } = await supabase
    .from('movimientos')
    .select('*')
    .eq('tipo', 'comision')
    .order('created_at', { ascending: false })

  return (
    <AppShell perfil={perfil as Perfil} pageTitle="Comisiones">
      <ComisionesAdmin comisiones={(comisiones ?? []) as Movimiento[]} />
    </AppShell>
  )
}
