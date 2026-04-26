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
  // Lanzar en paralelo: licitaciones abiertas + IDs donde el carpintero ya cotizó
  const [abiertasRes, cotizadasRes] = await Promise.all([
    supabase
      .from('licitaciones')
      .select('id, titulo, estado, tipo_servicio, created_at, cliente_id, vence_en')
      .eq('estado', 'abierta')
      .order('created_at', { ascending: false }),
    supabase
      .from('cotizaciones')
      .select('licitacion_id')
      .eq('carpintero_id', carpinteroId),
  ])

  const abiertas = (abiertasRes.data ?? []) as Licitacion[]
  const licitacionIdsCotzadas = (cotizadasRes.data ?? []).map(
    (c: { licitacion_id: string }) => c.licitacion_id
  )

  // IDs de abiertas donde el carpintero NO cotizó aún (para el count de cotizaciones)
  const abiertasIds = abiertas.map((l) => l.id)

  // Lanzar en paralelo: contar cotizaciones en abiertas + traer licitaciones no-abiertas donde cotizó
  const idsNoAbiertas = licitacionIdsCotzadas.filter(
    (id) => !abiertasIds.includes(id)
  )

  const [countsRes, cotizadasDataRes] = await Promise.all([
    abiertasIds.length > 0
      ? supabase
          .from('cotizaciones')
          .select('licitacion_id')
          .in('licitacion_id', abiertasIds)
      : Promise.resolve({ data: [] }),
    idsNoAbiertas.length > 0
      ? supabase
          .from('licitaciones')
          .select('id, titulo, estado, tipo_servicio, created_at, cliente_id, vence_en')
          .in('id', idsNoAbiertas)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const cotizacionesCount: Record<string, number> = {}
  for (const c of (countsRes.data ?? []) as { licitacion_id: string }[]) {
    cotizacionesCount[c.licitacion_id] = (cotizacionesCount[c.licitacion_id] ?? 0) + 1
  }

  const cotizadasData = (cotizadasDataRes.data ?? []) as Licitacion[]
  const todas = [...abiertas, ...cotizadasData]

  // Deduplicar (por si acaso)
  const seen = new Set<string>()
  const unique = todas.filter((l) => {
    if (seen.has(l.id)) return false
    seen.add(l.id)
    return true
  })

  return unique.map((l) => ({
    ...l,
    cotizaciones_count: cotizacionesCount[l.id] ?? 0,
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
