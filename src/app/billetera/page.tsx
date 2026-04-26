import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import BilleteraClient from './BilleteraClient'
import type { Perfil } from '@/types/perfil'
import type { Movimiento } from '@/types/licitacion'

export default async function BilleteraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [perfilRes, movimientosRes] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', user.id).single(),
    supabase
      .from('movimientos')
      .select('*')
      .eq('perfil_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const perfil = perfilRes.data as Perfil | null
  if (!perfil) redirect('/login')

  const movimientos = (movimientosRes.data ?? []) as Movimiento[]

  return (
    <AppShell perfil={perfil} pageTitle="Mi Billetera">
      <BilleteraClient perfil={perfil} movimientos={movimientos} />
    </AppShell>
  )
}
