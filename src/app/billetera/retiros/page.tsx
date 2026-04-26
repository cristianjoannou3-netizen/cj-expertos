import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import RetirosAdmin from './RetirosAdmin'
import type { Perfil } from '@/types/perfil'
import type { Movimiento } from '@/types/licitacion'

export default async function RetirosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const { data: retiros } = await supabase
    .from('movimientos')
    .select('*, perfiles:perfil_id(nombre, email)')
    .eq('tipo', 'debito')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  return (
    <AppShell perfil={perfil as Perfil} pageTitle="Retiros pendientes">
      <RetirosAdmin retiros={(retiros ?? []) as (Movimiento & { perfiles: { nombre: string; email: string | null } })[]} />
    </AppShell>
  )
}
