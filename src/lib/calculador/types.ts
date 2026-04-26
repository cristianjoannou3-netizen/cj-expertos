// ============================================================
// Tipos del Calculador de Aberturas — CJ Expertos
// ============================================================

export type Linea = 'MODENA' | 'A30 New' | 'Herrero'
export type TipoBorde = 'recto' | 'curvo'
export type TipoSistema = 'camara_compensadora' | 'doble_contacto'
export type Relleno = 'vidrio' | 'tubular'

export interface Tipologia {
  id: string
  label: string
  lineas: Linea[]
}

export interface PerfilItem {
  perfil: number | string
  desc: string
  formula: string
  cant: number
  corte: string
  medida: number | null
  nota?: string
}

export interface PerfilCalculado {
  perfil: number | string
  desc: string
  medidaMm: number | null
  cantidad: number
  corte: string
  metrosUtilizar: number
  metrosComprar: number
  barras: number
  pesoKgM: number
  kgUtilizar: number
  kgComprar: number
  kgDeposito: number
  kgTotales: number
  nota?: string
}

export interface PanelVidrio {
  nombre: string
  ancho: number
  alto: number
}

export interface VidrioResult {
  paneles: PanelVidrio[]
  totalM2: number
}

export interface TubularInfo {
  codigo: string
  desc: string
  anchoMm: number
  coberturaMm: number
  cantidad: number
  totalMm: number
  barras: number
  pesoKgM: number
  largoBarra: number
  kgUtilizar: number
  kgComprar: number
}

export interface ResultadoCalculo {
  lista: PerfilCalculado[]
  totalKgUtilizar: number
  totalKgComprar: number
  totalKgDeposito: number
  totalKg: number
  vidrio: VidrioResult
  relleno: Relleno
  tubularInfo: TubularInfo[] | null
}

export interface ParametrosCalculo {
  linea: Linea
  tipologia: string
  A: number
  H: number
  dvh?: boolean
  relleno?: Relleno
  tubularCodigo?: string | null
  tipoBorde?: TipoBorde
  conTravesano?: boolean
  conVidrioRepartido?: boolean
  tipoSistema?: TipoSistema
}

export interface PresupuestoGuardado {
  id?: string
  obra_id?: string
  carpintero_id?: string
  nombre: string
  parametros: ParametrosCalculo
  resultado: ResultadoCalculo
  precio_kg_aluminio?: number
  precio_m2_vidrio?: number
  total_estimado?: number
  created_at?: string
}
