import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import LicitacionDetalle from './LicitacionDetalle'
import { getLicitacion, getProveedoresActivos, contarNotificacionesNoLeidas } from '@/lib/licitaciones'
import type { Perfil } from '@/types/perfil'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LicitacionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [licitacion, perfil, proveedores, notifCount] = await Promise.all([
    getLicitacion(id, supabase),
    supabase.from('perfiles').select('*').eq('id', user.id).single().then(r => r.data as Perfil | null),
    getProveedoresActivos(supabase),
    contarNotificacionesNoLeidas(user.id, supabase),
  ])

  if (!licitacion) notFound()

  // Cargar perfiles de participantes para mostrar nombres
  const participantesIds = [
    licitacion.cliente_id,
    ...licitacion.cotizaciones.map(c => c.carpintero_id),
  ]
  const uniqueIds = [...new Set(participantesIds)]

  const { data: participantesData } = await supabase
    .from('perfiles')
    .select('*')
    .in('id', uniqueIds)

  const carpinterosMap: Record<string, Perfil> = {}
  for (const p of (participantesData ?? [])) {
    carpinterosMap[p.id] = p as Perfil
  }

  return (
    <AppShell perfil={perfil} pageTitle={licitacion.titulo} notifCount={notifCount}>
      <LicitacionDetalle
        licitacion={licitacion}
        perfil={perfil!}
        carpinterosMap={carpinterosMap}
        proveedores={proveedores}
      />
    </AppShell>
  )
}
