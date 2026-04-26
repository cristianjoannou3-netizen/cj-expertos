import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import type { Perfil } from '@/types/perfil'
import EditarObraClient from './EditarObraClient'

export default async function EditarObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfilData } = await supabase
    .from('perfiles').select('*').eq('id', user.id).single()
  const perfil = perfilData as Perfil | null

  return (
    <AppShell perfil={perfil} pageTitle="Editar obra">
      <EditarObraClient id={id} />
    </AppShell>
  )
}
