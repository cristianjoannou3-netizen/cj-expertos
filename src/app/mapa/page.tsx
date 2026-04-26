import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import MapaCarpinteros from './MapaCarpinteros'
import type { Perfil } from '@/types/perfil'

export default async function MapaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [perfilRes, carpinterosRes] = await Promise.all([
    user
      ? supabase.from('perfiles').select('*').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('perfiles')
      .select('id,nombre,ciudad,provincia,rango,puntos,verificado,activo,avatar_url,bio,experiencia')
      .eq('rol', 'carpintero')
      .eq('activo', true)
      .order('puntos', { ascending: false }),
  ])

  const perfil = perfilRes.data as Perfil | null
  const carpinteros = (carpinterosRes.data ?? []) as Perfil[]

  return (
    <AppShell perfil={perfil} pageTitle="Mapa de carpinteros">
      <div className="h-[calc(100vh-130px)] -m-4 lg:-m-6">
        <MapaCarpinteros carpinteros={carpinteros} />
      </div>
    </AppShell>
  )
}
