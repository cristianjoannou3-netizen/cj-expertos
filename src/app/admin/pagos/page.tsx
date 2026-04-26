import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import PagosAdmin from './PagosAdmin'
import type { Perfil } from '@/types/perfil'
import type { Pago } from '@/types/licitacion'

const PAGE_SIZE = 10

interface Props {
  searchParams: Promise<{ page?: string; estado?: string; metodo?: string }>
}

export default async function AdminPagosPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const page = parseInt(params.page ?? '0', 10)
  const estadoFilter = params.estado
  const metodoFilter = params.metodo

  let query = supabase
    .from('pagos')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

  if (estadoFilter) query = query.eq('estado', estadoFilter)
  if (metodoFilter) query = query.eq('metodo', metodoFilter)

  const { data: pagos, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <AppShell perfil={perfil as Perfil} pageTitle="Pagos">
      <PagosAdmin
        pagos={(pagos ?? []) as Pago[]}
        page={page}
        totalPages={totalPages}
        filters={{ estado: estadoFilter, metodo: metodoFilter }}
      />
    </AppShell>
  )
}
