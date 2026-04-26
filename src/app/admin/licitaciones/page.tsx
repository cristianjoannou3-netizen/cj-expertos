import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import LicitacionesAdmin from './LicitacionesAdmin'
import type { Perfil } from '@/types/perfil'
import type { Licitacion } from '@/types/licitacion'

const PAGE_SIZE = 10

interface Props {
  searchParams: Promise<{ page?: string; estado?: string; q?: string }>
}

export default async function AdminLicitacionesPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const page = parseInt(params.page ?? '0', 10)
  const estadoFilter = params.estado
  const q = params.q?.trim()

  let query = supabase
    .from('licitaciones')
    .select('*, perfiles:cliente_id(nombre)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

  if (estadoFilter) query = query.eq('estado', estadoFilter)
  if (q) query = query.ilike('titulo', `%${q}%`)

  const { data: licitaciones, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <AppShell perfil={perfil as Perfil} pageTitle="Licitaciones">
      <LicitacionesAdmin
        licitaciones={(licitaciones ?? []) as (Licitacion & { perfiles: { nombre: string } })[]}
        page={page}
        totalPages={totalPages}
        filters={{ estado: estadoFilter, q }}
      />
    </AppShell>
  )
}
