import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import CarpinterosSearch from './CarpinterosSearch'
import type { Perfil } from '@/types/perfil'

export default async function CarpinterosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [perfilRes, carpinterosRes] = await Promise.all([
    user
      ? supabase.from('perfiles').select('*').eq('id', user.id).single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'carpintero')
      .eq('activo', true)
      .order('puntos', { ascending: false }),
  ])

  const perfil = perfilRes.data as Perfil | null
  const lista = ((carpinterosRes.data ?? []) as Perfil[])

  return (
    <AppShell perfil={perfil} pageTitle="Directorio de Carpinteros">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-800">Directorio de Carpinteros</h1>
          <p className="text-slate-500 text-sm mt-1">
            {lista.length} carpintero{lista.length !== 1 ? 's' : ''} registrado{lista.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CarpinterosSearch lista={lista} />
      </div>
    </AppShell>
  )
}
