import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import type { Perfil } from '@/types/perfil'
import SolicitudesClient from './SolicitudesClient'

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfilData } = await supabase
    .from('perfiles').select('*').eq('id', user.id).single()
  const perfil = perfilData as Perfil | null

  if (perfil?.rol !== 'proveedor' && perfil?.rol !== 'admin') {
    redirect('/dashboard')
  }

  const { data: solicitudes } = await supabase
    .from('solicitudes_materiales')
    .select(`
      id,
      estado,
      created_at,
      licitacion_id,
      carpintero_id,
      proveedor_id,
      licitaciones ( id, titulo ),
      perfiles!carpintero_id ( id, nombre, empresa )
    `)
    .eq('proveedor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <AppShell perfil={perfil} pageTitle="Solicitudes de materiales">
      <SolicitudesClient solicitudes={(solicitudes ?? []) as unknown as Parameters<typeof SolicitudesClient>[0]['solicitudes']} proveedorId={user.id} />
    </AppShell>
  )
}
