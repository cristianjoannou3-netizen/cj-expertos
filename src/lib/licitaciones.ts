import type { SupabaseClient } from '@supabase/supabase-js'
import type { Licitacion, Cotizacion, EtapaCertificacion, ContratoFirma, Cita, Pago, LicitacionDetalle } from '@/types/licitacion'
import type { Perfil } from '@/types/perfil'

// ─── Licitaciones ─────────────────────────────────────────────

export async function getLicitacion(
  id: string,
  supabase: SupabaseClient
): Promise<LicitacionDetalle | null> {
  const [lic, cotizaciones, etapas, contratos, citas, pagosRes] = await Promise.all([
    supabase.from('licitaciones').select('*').eq('id', id).single(),
    supabase.from('cotizaciones').select('*').eq('licitacion_id', id).order('created_at'),
    supabase.from('etapas_certificacion').select('*').eq('licitacion_id', id).order('orden'),
    supabase.from('contrato_firma').select('*').eq('licitacion_id', id),
    supabase.from('citas').select('*').eq('licitacion_id', id).order('created_at'),
    supabase.from('pagos').select('*').eq('licitacion_id', id).order('created_at'),
  ])

  if (!lic.data) return null

  // Determinar carpintero adjudicado: primera cotizacion si estado != abierta
  const licitacion = lic.data as Licitacion
  const cotsData = (cotizaciones.data ?? []) as Cotizacion[]
  const carpintero_elegido_id: string | null =
    licitacion.estado !== 'abierta' && cotsData.length > 0
      ? cotsData[0].carpintero_id
      : null

  return {
    ...licitacion,
    cotizaciones: cotsData,
    etapas: (etapas.data ?? []) as EtapaCertificacion[],
    contratos: (contratos.data ?? []) as ContratoFirma[],
    citas: (citas.data ?? []) as Cita[],
    pagos: (pagosRes.data ?? []) as Pago[],
    carpintero_elegido_id,
  }
}

export async function getLicitacionesByCliente(
  clienteId: string,
  supabase: SupabaseClient
): Promise<(Licitacion & { cotizaciones_count: number })[]> {
  const { data } = await supabase
    .from('licitaciones')
    .select('*, cotizaciones(count)')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })

  if (!data) return []

  return data.map((l: Licitacion & { cotizaciones: { count: number }[] }) => ({
    ...l,
    cotizaciones_count: l.cotizaciones?.[0]?.count ?? 0,
  }))
}

export async function getLicitacionesParaCarpintero(
  carpinteroId: string,
  supabase: SupabaseClient
): Promise<(Licitacion & { cotizaciones_count: number })[]> {
  // Licitaciones abiertas donde fue invitado (por notificaciones) + donde ya cotizó
  const { data: cotizadas } = await supabase
    .from('cotizaciones')
    .select('licitacion_id')
    .eq('carpintero_id', carpinteroId)

  const licitacionIdsCotzadas = (cotizadas ?? []).map((c: { licitacion_id: string }) => c.licitacion_id)

  // Todas las licitaciones abiertas visibles para carpinteros activos
  const { data: abiertas } = await supabase
    .from('licitaciones')
    .select('*, cotizaciones(count)')
    .eq('estado', 'abierta')
    .order('created_at', { ascending: false })

  // Licitaciones donde ya cotizó (cualquier estado)
  let cotizadasData: (Licitacion & { cotizaciones: { count: number }[] })[] = []
  if (licitacionIdsCotzadas.length > 0) {
    const { data } = await supabase
      .from('licitaciones')
      .select('*, cotizaciones(count)')
      .in('id', licitacionIdsCotzadas)
      .neq('estado', 'abierta')
      .order('created_at', { ascending: false })
    cotizadasData = data ?? []
  }

  const todasAbiertas = (abiertas ?? []) as (Licitacion & { cotizaciones: { count: number }[] })[]
  const todas = [...todasAbiertas, ...cotizadasData]

  // Deduplicar
  const seen = new Set<string>()
  const unique = todas.filter(l => {
    if (seen.has(l.id)) return false
    seen.add(l.id)
    return true
  })

  return unique.map(l => ({
    ...l,
    cotizaciones_count: l.cotizaciones?.[0]?.count ?? 0,
  }))
}

export async function getCarpinterosActivos(supabase: SupabaseClient): Promise<Perfil[]> {
  const { data } = await supabase
    .from('perfiles')
    .select('*')
    .eq('rol', 'carpintero')
    .eq('activo', true)
    .order('nombre')
  return (data ?? []) as Perfil[]
}

export async function getProveedoresActivos(supabase: SupabaseClient): Promise<Perfil[]> {
  const { data } = await supabase
    .from('perfiles')
    .select('id, nombre, empresa, rol')
    .eq('rol', 'proveedor')
    .eq('activo', true)
    .order('nombre')
  return (data ?? []) as Perfil[]
}

// ─── Notificaciones ───────────────────────────────────────────

export async function insertarNotificacion(
  supabase: SupabaseClient,
  params: {
    usuario_id: string
    tipo: string
    titulo: string
    mensaje: string
    link: string
  }
) {
  await supabase.from('notificaciones').insert(params)
}

export async function contarNotificacionesNoLeidas(
  usuarioId: string,
  supabase: SupabaseClient
): Promise<number> {
  const { count } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('leida', false)
  return count ?? 0
}
