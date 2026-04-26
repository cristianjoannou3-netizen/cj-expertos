import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import UsuariosAdmin from './UsuariosAdmin'
import type { Perfil } from '@/types/perfil'

const PAGE_SIZE = 10

interface Props {
  searchParams: Promise<{ page?: string; rol?: string; activo?: string; q?: string }>
}

export default async function AdminUsuariosPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const page = parseInt(params.page ?? '0', 10)
  const rolFilter = params.rol
  const activoFilter = params.activo
  const q = params.q?.trim()

  let query = supabase
    .from('perfiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

  if (rolFilter) query = query.eq('rol', rolFilter)
  if (activoFilter !== undefined && activoFilter !== '') query = query.eq('activo', activoFilter === 'true')
  if (q) query = query.ilike('nombre', `%${q}%`)

  const { data: usuarios, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <AppShell perfil={perfil as Perfil} pageTitle="Usuarios">
      <UsuariosAdmin
        usuarios={(usuarios ?? []) as Perfil[]}
        page={page}
        totalPages={totalPages}
        filters={{ rol: rolFilter, activo: activoFilter, q }}
      />
    </AppShell>
  )
}
