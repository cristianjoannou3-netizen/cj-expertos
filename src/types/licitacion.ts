export type EstadoLicitacion =
  | 'abierta'
  | 'adjudicada'
  | 'en_curso'
  | 'completada'
  | 'vencida'
  | 'cancelada'

export type EstadoEtapa = 'pendiente' | 'en_revision' | 'aprobada' | 'disputada'

export type EstadoCita = 'propuesta' | 'confirmada' | 'rechazada' | 'completada'

export interface Licitacion {
  id: string
  cliente_id: string
  titulo: string
  descripcion: string | null
  tipo_servicio: string | null
  plano_url: string | null
  estado: EstadoLicitacion
  vence_en: string | null
  created_at: string
  updated_at: string
}

export interface Cotizacion {
  id: string
  licitacion_id: string
  carpintero_id: string
  monto: number
  detalle: string | null
  created_at: string
}

export interface EtapaCertificacion {
  id: string
  licitacion_id: string
  nombre: string
  orden: number
  estado: EstadoEtapa
  foto_url: string | null
  comentario_carpintero: string | null
  comentario_cliente: string | null
  created_at: string
  updated_at: string
}

export interface ContratoFirma {
  id: string
  licitacion_id: string
  firmante_id: string
  nombre_completo: string
  dni: string | null
  acepta_terminos: boolean
  firma_imagen_url: string | null
  firmado_en: string | null
  created_at: string
}

export interface Cita {
  id: string
  licitacion_id: string
  carpintero_id: string
  cliente_id: string
  fecha_propuesta: string
  estado: EstadoCita
  notas: string | null
  created_at: string
  updated_at: string
}

export interface Notificacion {
  id: string
  usuario_id: string
  tipo: string
  titulo: string
  mensaje: string | null
  leida: boolean
  link: string | null
  created_at: string
}

export interface SolicitudMaterial {
  id: string
  carpintero_id: string
  proveedor_id: string | null
  licitacion_id: string | null
  estado: string
  created_at: string
  updated_at: string
}

export interface ItemSolicitud {
  id: string
  solicitud_id: string
  descripcion: string
  cantidad: number
  precio_unitario: number | null
  created_at: string
}

export interface Pago {
  id: string
  licitacion_id: string
  tramo: number
  monto: number
  monto_mp: number | null
  metodo: string | null
  mp_payment_id: string | null
  comprobante_url: string | null
  estado: 'pendiente' | 'confirmado' | 'rechazado' | 'retenido' | 'liberado'
  created_at: string
  updated_at: string
}

export interface Movimiento {
  id: string
  perfil_id: string
  obra_id: string | null
  tipo: 'credito' | 'debito' | 'comision'
  monto: number
  descripcion: string | null
  estado: 'completado' | 'pendiente' | 'rechazado'
  cbu_alias: string | null
  created_at: string
}

export interface ConfigPlataforma {
  id: number
  comision_porcentaje: number
  comision_minima: number
  updated_at: string
}

// Tipo de detalle de licitacion con joins
export interface LicitacionDetalle extends Licitacion {
  cotizaciones: Cotizacion[]
  etapas: EtapaCertificacion[]
  contratos: ContratoFirma[]
  citas: Cita[]
  pagos: Pago[]
  carpintero_elegido_id: string | null
}
