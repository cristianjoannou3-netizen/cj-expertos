// ============================================================
// Calculador de Aberturas — CJ Expertos (migrado desde src/utils/calculadorAbertura.js)
// Catálogos: MODENA · A30 New · Herrero
// ============================================================
import type {
  Linea,
  Tipologia,
  PerfilItem,
  PerfilCalculado,
  VidrioResult,
  TubularInfo,
  ResultadoCalculo,
  ParametrosCalculo,
} from './types'

export const LINEAS: Linea[] = ['MODENA', 'A30 New', 'Herrero']

export const TIPOLOGIAS: Tipologia[] = [
  { id: 'VC',           label: 'Ventana Corrediza 2 hojas',       lineas: ['MODENA', 'A30 New', 'Herrero'] },
  { id: 'PC',           label: 'Puerta Corrediza 2 hojas',        lineas: ['MODENA', 'A30 New', 'Herrero'] },
  { id: 'VC4',          label: 'Ventana Corrediza 4 hojas',       lineas: ['MODENA', 'A30 New', 'Herrero'] },
  { id: 'PC4',          label: 'Puerta Corrediza 4 hojas',        lineas: ['MODENA', 'A30 New', 'Herrero'] },
  { id: 'VC3',          label: 'Ventana Corrediza 3 hojas',       lineas: ['MODENA', 'A30 New', 'Herrero'] },
  { id: 'PC3',          label: 'Puerta Corrediza 3 hojas',        lineas: ['MODENA', 'A30 New', 'Herrero'] },
  { id: 'VAR',          label: 'Ventana de Abrir borde Recto',    lineas: ['MODENA', 'A30 New'] },
  { id: 'VAC',          label: 'Ventana de Abrir borde Curvo',    lineas: ['MODENA', 'A30 New'] },
  { id: 'VAR2',         label: 'Ventana de Abrir Recto 2 hojas',  lineas: ['MODENA', 'A30 New'] },
  { id: 'VAC2',         label: 'Ventana de Abrir Curvo 2 hojas',  lineas: ['MODENA', 'A30 New'] },
  { id: 'PR',           label: 'Puerta de Rebatir 1 hoja',        lineas: ['MODENA', 'A30 New', 'Herrero'] },
  { id: 'PR2',          label: 'Puerta de Rebatir 2 hojas',       lineas: ['MODENA', 'A30 New', 'Herrero'] },
  { id: 'PF',           label: 'Paño Fijo',                       lineas: ['MODENA', 'A30 New', 'Herrero'] },
  { id: 'PV',           label: 'Puerta Vaivén 1 hoja',            lineas: ['MODENA', 'A30 New'] },
  { id: 'PV2',          label: 'Puerta Vaivén 2 hojas',           lineas: ['A30 New'] },
  { id: 'VProyectante', label: 'Ventana Proyectante',             lineas: ['MODENA'] },
  { id: 'VADCR',        label: 'Ventana Abrir Doble Contacto',    lineas: ['MODENA'] },
  { id: 'VADCR2',       label: 'Ventana Abrir DC 2 hojas',        lineas: ['MODENA'] },
  { id: 'BAN',          label: 'Banderola',                       lineas: ['MODENA'] },
  { id: 'VTL',          label: 'Ventiluz',                        lineas: ['MODENA'] },
]

// ── Pesos kg/m ───────────────────────────────────────────────
const PESOS_MODENA: Record<number, number> = {
  5989: 0.141, 6200: 1.266, 6201: 0.675, 6203: 0.664, 6204: 0.705,
  6205: 0.397, 6206: 0.181, 6207: 0.613, 6208: 0.813, 6209: 1.258,
  6210: 0.789, 6211: 0.848, 6212: 0.316, 6213: 0.257, 6214: 1.088,
  6215: 0.864, 6216: 0.726, 6217: 0.294, 6218: 1.150, 6219: 1.647,
  6220: 0.176, 6221: 0.767, 6222: 0.842, 6223: 0.921, 6224: 0.794,
  6225: 0.257, 6226: 0.211, 6227: 0.864, 6228: 0.186, 6229: 0.764,
  6230: 0.213, 6231: 0.170, 6234: 0.888, 6235: 0.902, 6236: 0.902,
  6237: 0.181, 6238: 0.189, 6239: 0.705, 6240: 1.823, 6241: 0.975,
  6243: 0.548, 6244: 0.913, 6245: 0.678, 6246: 0.291, 6248: 0.635,
  6249: 0.675, 6250: 0.583, 6251: 0.783, 6252: 1.215, 6253: 0.689,
  6254: 0.302, 6255: 0.424, 6256: 0.508, 6257: 0.240, 6258: 1.061,
  6259: 0.726, 6260: 1.099, 6261: 1.280, 6262: 0.680, 6263: 1.671,
  6264: 0.719, 6265: 0.543, 6266: 0.383, 6267: 0.383, 6268: 0.429,
  6269: 0.670, 6270: 0.651, 6271: 0.880, 6272: 1.156, 6273: 0.456,
  6274: 1.029, 6275: 0.880, 6276: 1.315, 6277: 0.518, 6278: 0.319,
  6279: 0.392, 6280: 0.367, 6281: 1.723, 6282: 0.605, 6283: 0.381,
  6901: 0.710, 6902: 0.470, 6903: 0.462, 6904: 1.088, 6905: 1.318,
}
const PESOS_A30: Record<number, number> = {
  5965: 0.288, 5989: 0.151, 5996: 0.991, 5997: 0.861,
  6011: 0.521, 6012: 0.543, 6013: 1.288, 6021: 0.780,
  6023: 0.470, 6024: 0.454, 6027: 0.251, 6028: 0.205,
  6034: 1.399, 6035: 1.531, 6036: 0.891, 6037: 1.774,
  6038: 0.594, 6039: 0.329, 6040: 1.193, 6041: 1.388,
  6042: 1.399, 6043: 2.319, 6044: 1.037, 6045: 0.351,
  6046: 0.259, 6047: 0.254, 6048: 0.197, 6049: 0.232,
  6050: 0.192, 6051: 0.986, 6052: 1.139, 6053: 1.094,
  6054: 1.148, 6055: 1.193, 6056: 1.148, 6059: 1.193,
  6060: 0.986, 6061: 0.705, 6062: 0.861, 6066: 0.780,
  6067: 1.094, 6068: 0.770, 6069: 1.758, 6070: 0.743,
  6071: 1.334, 6072: 1.466, 6073: 0.861, 6074: 1.412,
  6075: 1.544, 6076: 1.185, 6077: 0.578, 6078: 1.758,
  6079: 0.994, 6080: 1.701, 6081: 2.908, 6082: 1.463,
  6083: 1.528, 6084: 0.770, 6087: 2.816, 6088: 1.976,
  6206: 0.186, 6245: 0.629, 6254: 0.302, 6255: 0.424,
  6256: 0.543, 6265: 0.543, 7656: 1.507, 7657: 1.801,
}
const PESOS_HERRERO: Record<number, number> = {
  17: 1.100,  22: 0.359,  30: 0.383,  31: 0.264,  32: 0.274,
  37: 0.268,  39: 0.536,  40: 0.311,  44: 0.848,  45: 0.144,
  46: 0.360,  47: 0.860,  48: 0.355,  53: 0.645,  54: 0.498,
  58: 1.141, 100: 0.584, 101: 0.742, 102: 0.443, 103: 0.454,
 104: 0.413, 105: 0.278, 107: 0.650, 108: 0.355, 161: 0.454,
 178: 0.464, 185: 1.339, 186: 1.204, 188: 0.367, 332: 0.644,
 417: 0.293, 418: 0.271, 599: 0.605, 691: 1.323, 822: 0.429,
 973: 0.483, 987: 1.312,
}

const BARRA_MM = 6150

// ── Fórmulas ──────────────────────────────────────────────────
function calcMedida(formula: string, A: number, H: number): number | null {
  const f = formula.trim()
  if (f === 'H') return H
  if (f === 'A') return A
  if (f.startsWith('H+')) return H + parseInt(f.slice(2))
  if (f.startsWith('H-')) return H - parseInt(f.slice(2))
  if (f.startsWith('A+')) return A + parseInt(f.slice(2))
  if (f.startsWith('A-')) return A - parseInt(f.slice(2))
  if (f === '(A/2)') return Math.round(A / 2)
  if (f.startsWith('(A/2)-')) return Math.round(A / 2) - parseInt(f.slice(6))
  if (f.startsWith('(A/2)+')) return Math.round(A / 2) + parseInt(f.slice(6))
  if (f.startsWith('(A/3)-')) return Math.round(A / 3) - parseInt(f.slice(6))
  if (f.startsWith('(A/3)+')) return Math.round(A / 3) + parseInt(f.slice(6))
  if (f === '(A/4)') return Math.round(A / 4)
  if (f.startsWith('(A/4)+')) return Math.round(A / 4) + parseInt(f.slice(6))
  if (f.startsWith('(A/4)-')) return Math.round(A / 4) - parseInt(f.slice(6))
  if (f.startsWith('(2A/3)-')) return Math.round((2 * A) / 3) - parseInt(f.slice(7))
  // Expresiones con resta al final, ej: "(A/2)-23-12"
  const doubleMinus = f.match(/^\(A\/(\d+)\)-(\d+)-(\d+)$/)
  if (doubleMinus) return Math.round(A / parseInt(doubleMinus[1])) - parseInt(doubleMinus[2]) - parseInt(doubleMinus[3])
  return null
}

function mp(arr: Omit<PerfilItem, 'medida'>[], A: number, H: number): PerfilItem[] {
  return arr.map(p => ({ ...p, medida: calcMedida(p.formula, A, H) }))
}

// ── MODENA ────────────────────────────────────────────────────
function getPerfilesMODENA_VC(A: number, H: number, dvh: boolean): PerfilItem[] {
  return mp([
    { perfil: 6205, desc: 'Jambas premarco',             formula: 'H+36',     cant: 2, corte: '45-45' },
    { perfil: 6205, desc: 'Umbral/dintel premarco',      formula: 'A+36',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+53',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+53',     cant: 2, corte: '45-45' },
    { perfil: 6201, desc: 'Jambas marco',                formula: 'H',        cant: 2, corte: '90-90' },
    { perfil: 6200, desc: 'Umbral/dintel marco',         formula: 'A-42',     cant: 2, corte: '90-90' },
    { perfil: dvh ? 6248 : 6203, desc: 'Parante lateral hoja', formula: 'H-79',     cant: 2, corte: '90-90' },
    { perfil: dvh ? 6249 : 6204, desc: 'Zócalo/cabezal hoja',  formula: '(A/2)-24', cant: 4, corte: '90-90' },
    { perfil: dvh ? 6250 : 6207, desc: 'Parante central',       formula: 'H-79',     cant: 1, corte: '90-90' },
    { perfil: 6255, desc: 'Jambas mosquitero',           formula: 'H-88',     cant: 2, corte: '45-45' },
    { perfil: 6255, desc: 'Zócalo/cabezal mosquitero',  formula: '(A/2)-7',  cant: 2, corte: '45-45' },
    { perfil: 6256, desc: 'Travesaño mosquitero',        formula: '(A/2)-70', cant: 1, corte: '90-90' },
  ], A, H)
}
function getPerfilesMODENA_VC3(A: number, H: number, dvh: boolean): PerfilItem[] {
  return mp([
    { perfil: 6205, desc: 'Jambas premarco',             formula: 'H+36',     cant: 2, corte: '45-45' },
    { perfil: 6205, desc: 'Umbral/dintel premarco',      formula: 'A+36',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+53',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+53',     cant: 2, corte: '45-45' },
    { perfil: 6201, desc: 'Jambas marco',                formula: 'H',        cant: 2, corte: '90-90' },
    { perfil: 6200, desc: 'Umbral/dintel marco',         formula: 'A-42',     cant: 2, corte: '90-90' },
    { perfil: dvh ? 6248 : 6203, desc: 'Parante lateral hoja', formula: 'H-79',     cant: 4, corte: '90-90' },
    { perfil: dvh ? 6249 : 6204, desc: 'Zócalo/cabezal hojas', formula: '(A/3)-24', cant: 6, corte: '90-90' },
    { perfil: dvh ? 6250 : 6207, desc: 'Parante central hoja', formula: 'H-79',     cant: 2, corte: '90-90' },
    { perfil: 6255, desc: 'Jambas mosquitero',           formula: 'H-88',     cant: 2, corte: '45-45' },
    { perfil: 6255, desc: 'Zócalo/cabezal mosquitero',  formula: '(A/2)-7',  cant: 2, corte: '45-45' },
    { perfil: 6256, desc: 'Travesaño mosquitero',        formula: '(A/2)-70', cant: 1, corte: '90-90' },
  ], A, H)
}
function getPerfilesMODENA_VC4(A: number, H: number, dvh: boolean): PerfilItem[] {
  return mp([
    { perfil: 6205, desc: 'Jambas premarco',             formula: 'H+36',     cant: 2, corte: '45-45' },
    { perfil: 6205, desc: 'Umbral/dintel premarco',      formula: 'A+36',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+53',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+53',     cant: 2, corte: '45-45' },
    { perfil: 6201, desc: 'Jambas marco',                formula: 'H',        cant: 2, corte: '90-90' },
    { perfil: 6200, desc: 'Umbral/dintel marco',         formula: 'A-42',     cant: 2, corte: '90-90' },
    { perfil: dvh ? 6248 : 6203, desc: 'Parante lateral hoja', formula: 'H-79',     cant: 4, corte: '90-90' },
    { perfil: dvh ? 6249 : 6204, desc: 'Zócalo/cabezal hojas', formula: '(A/4)-24', cant: 8, corte: '90-90' },
    { perfil: dvh ? 6250 : 6207, desc: 'Parante central hoja', formula: 'H-79',     cant: 4, corte: '90-90' },
    { perfil: 6255, desc: 'Jambas mosquitero',           formula: 'H-88',     cant: 2, corte: '45-45' },
    { perfil: 6255, desc: 'Zócalo/cabezal mosquitero',  formula: '(A/2)-7',  cant: 2, corte: '45-45' },
    { perfil: 6256, desc: 'Travesaño mosquitero',        formula: '(A/2)-70', cant: 1, corte: '90-90' },
  ], A, H)
}
function getPerfilesMODENA_PR(A: number, H: number, dvh: boolean, dosHojas: boolean, conTravesanos: boolean): PerfilItem[] {
  const altHoja = H - 24
  const anchoHoja = dosHojas ? Math.round(A / 2) - 23 : A - 39
  const cantHojas = dosHojas ? 2 : 1
  const items: Omit<PerfilItem, 'medida'>[] = [
    { perfil: 6205, desc: 'Jambas premarco',             formula: 'H+36', cant: 2, corte: '45-45' },
    { perfil: 6205, desc: 'Umbral/dintel premarco',      formula: 'A+36', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+53', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+53', cant: 2, corte: '45-45' },
    { perfil: 6216, desc: 'Jambas marco',                formula: 'H',    cant: 2, corte: '45-45' },
    { perfil: 6216, desc: 'Umbral/dintel marco',         formula: 'A',    cant: 2, corte: '45-45' },
    { perfil: 6214, desc: 'Batientes laterales hoja', formula: 'H-24',                             cant: 2 * cantHojas, corte: '45-45' },
    { perfil: 6214, desc: 'Cabezal hoja',             formula: dosHojas ? '(A/2)-23' : 'A-39',     cant: cantHojas,     corte: '45-45' },
    { perfil: 6219, desc: 'Zócalo hoja',              formula: dosHojas ? '(A/2)-23-12' : 'A-51', cant: cantHojas,     corte: '45-45' },
    ...(dosHojas ? [{ perfil: 6224, desc: 'Encuentro central', formula: 'H-94', cant: 1, corte: '45-45' }] : []),
    ...(conTravesanos ? [
      { perfil: 6218, desc: 'Travesaño horizontal', formula: dosHojas ? '(A/2)-23-152' : 'A-191', cant: cantHojas,     corte: '45-45' },
      { perfil: 6218, desc: 'Travesaño vertical',   formula: 'H-85',                               cant: 2 * cantHojas, corte: '45-45' },
    ] : []),
  ]
  return items.map(p => ({ ...p, medida: calcMedida(p.formula, A, H) ?? (
    p.formula.includes('H-24') ? altHoja :
    p.formula.includes('(A/2)-23') ? anchoHoja :
    p.formula === 'A-39' ? anchoHoja : null
  )}))
}
function getPerfilesMODENA_VAR(A: number, H: number, dvh: boolean, dosHojas: boolean, tipoBorde: string): PerfilItem[] {
  const perfilHoja = tipoBorde === 'curvo' ? 6234 : 6211
  const hojaFormula = dosHojas ? '(A/2)-23' : 'A-39'
  const hojaCant = dosHojas ? 4 : 2
  return mp([
    { perfil: 6205, desc: 'Jambas premarco',             formula: 'H+36', cant: 2, corte: '45-45' },
    { perfil: 6205, desc: 'Umbral/dintel premarco',      formula: 'A+36', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+53', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+53', cant: 2, corte: '45-45' },
    { perfil: 6210, desc: 'Jambas marco',                formula: 'H',    cant: 2, corte: '45-45' },
    { perfil: 6210, desc: 'Umbral/dintel marco',         formula: 'A',    cant: 2, corte: '45-45' },
    { perfil: perfilHoja, desc: `Jambas hoja (${tipoBorde})`,         formula: 'H-39',     cant: dosHojas ? 4 : 2, corte: '45-45' },
    { perfil: perfilHoja, desc: `Zócalo/cabezal hoja (${tipoBorde})`, formula: hojaFormula, cant: hojaCant,         corte: '45-45' },
    ...(dosHojas ? [{ perfil: 6223, desc: 'Encuentro central 2 hojas', formula: 'H-104', cant: 1, corte: '90-90' }] : []),
  ], A, H)
}
function getPerfilesMODENA_VADCR(A: number, H: number, dvh: boolean, dosHojas: boolean, tipoBorde: string): PerfilItem[] {
  const perfilHoja = tipoBorde === 'curvo' ? 6235 : 6215
  const hojaFormula = dosHojas ? '(A/2)-23' : 'A-39'
  const hojaCant = dosHojas ? 4 : 2
  return mp([
    { perfil: 6205, desc: 'Jambas premarco',             formula: 'H+36', cant: 2, corte: '45-45' },
    { perfil: 6205, desc: 'Umbral/dintel premarco',      formula: 'A+36', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+53', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+53', cant: 2, corte: '45-45' },
    { perfil: 6216, desc: 'Jambas marco DC',             formula: 'H',    cant: 2, corte: '45-45' },
    { perfil: 6216, desc: 'Umbral/dintel marco DC',      formula: 'A',    cant: 2, corte: '45-45' },
    { perfil: perfilHoja, desc: `Jambas hoja DC (${tipoBorde})`,         formula: 'H-39',     cant: dosHojas ? 4 : 2, corte: '45-45' },
    { perfil: perfilHoja, desc: `Zócalo/cabezal hoja DC (${tipoBorde})`, formula: hojaFormula, cant: hojaCant,         corte: '45-45' },
    ...(dosHojas ? [{ perfil: 6224, desc: 'Encuentro central DC', formula: 'H-94', cant: 1, corte: '90-90' }] : []),
  ], A, H)
}
function getPerfilesMODENA_PF(A: number, H: number, dvh: boolean, opts: { tipoBorde?: string; conTravesano?: boolean; conVidrioRepartido?: boolean }): PerfilItem[] {
  const { tipoBorde = 'recto', conTravesano = false, conVidrioRepartido = false } = opts
  const perfilMarco = tipoBorde === 'curvo' ? 6229 : 6216
  const base: Omit<PerfilItem, 'medida'>[] = [
    { perfil: 6205,       desc: 'Jambas premarco',             formula: 'H+36', cant: 2, corte: '45-45' },
    { perfil: 6205,       desc: 'Umbral/dintel premarco',      formula: 'A+36', cant: 2, corte: '45-45' },
    { perfil: 6206,       desc: 'Jambas tapa premarco',        formula: 'H+53', cant: 2, corte: '45-45' },
    { perfil: 6206,       desc: 'Umbral/dintel tapa premarco', formula: 'A+53', cant: 2, corte: '45-45' },
    { perfil: perfilMarco, desc: `Jambas marco PF`,             formula: 'H',    cant: 2, corte: '45-45' },
    { perfil: perfilMarco, desc: `Umbral/dintel marco PF`,      formula: 'A',    cant: 2, corte: '45-45' },
    ...(conTravesano ? [
      { perfil: 6221, desc: 'Travesaño PF horizontal', formula: 'A-26', cant: 1, corte: '90-90' },
      { perfil: 6221, desc: 'Travesaño PF vertical',   formula: 'H-26', cant: 1, corte: '90-90' },
    ] : []),
    ...(conVidrioRepartido ? [
      { perfil: 6266, desc: 'Marco vidrio repartido',     formula: 'H', cant: 2, corte: '90-90' },
      { perfil: 6268, desc: 'Travesaño vidrio repartido', formula: 'A', cant: 1, corte: '90-90' },
    ] : []),
  ]
  return mp(base, A, H)
}

// ── A30 New ───────────────────────────────────────────────────
function getPerfilesA30_VC(A: number, H: number, dvh: boolean): PerfilItem[] {
  return mp([
    { perfil: 6066, desc: 'Jambas premarco',             formula: 'H+37',     cant: 2, corte: '45-45' },
    { perfil: 6066, desc: 'Umbral/dintel premarco',      formula: 'A+37',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+54',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+54',     cant: 2, corte: '45-45' },
    { perfil: 6036, desc: 'Jambas marco',                formula: 'H',        cant: 2, corte: '90-90' },
    { perfil: 6037, desc: 'Umbral/dintel marco',         formula: 'A-45',     cant: 2, corte: '90-90' },
    { perfil: dvh ? 6071 : 6034, desc: 'Parante lateral hoja', formula: 'H-86',     cant: 2, corte: '90-90' },
    { perfil: dvh ? 6072 : 6035, desc: 'Parante central hoja', formula: 'H-86',     cant: 2, corte: '90-90' },
    { perfil: dvh ? 6073 : 6061, desc: 'Zócalo/cabezal hoja',  formula: '(A/2)-14', cant: 4, corte: '90-90' },
    { perfil: dvh ? 6074 : 6062, desc: 'Zócalo alto hoja',     formula: '(A/2)-14', cant: 2, corte: '90-90' },
    { perfil: dvh ? 5997 : 5996, desc: 'Travesaño hoja',       formula: '(A/2)-96', cant: 2, corte: '90-90' },
    { perfil: dvh ? 6038 : 6255, desc: 'Jambas mosquitero',    formula: 'H-96',     cant: 2, corte: '45-45' },
    { perfil: dvh ? 6038 : 6255, desc: 'Zócalo/cabezal mosq.', formula: '(A/2)+10', cant: 2, corte: '45-45' },
    { perfil: 6039,              desc: 'Tope mosquitero',       formula: 'H-109',    cant: 2, corte: '90-90' },
  ], A, H)
}
function getPerfilesA30_VC4(A: number, H: number, dvh: boolean): PerfilItem[] {
  return mp([
    { perfil: 6066, desc: 'Jambas premarco',             formula: 'H+37',     cant: 2, corte: '45-45' },
    { perfil: 6066, desc: 'Umbral/dintel premarco',      formula: 'A+37',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+54',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+54',     cant: 2, corte: '45-45' },
    { perfil: 6036, desc: 'Jambas marco',                formula: 'H',        cant: 2, corte: '90-90' },
    { perfil: 6037, desc: 'Umbral/dintel marco',         formula: 'A-45',     cant: 2, corte: '90-90' },
    { perfil: dvh ? 6071 : 6034, desc: 'Parante lateral', formula: 'H-86',    cant: 4, corte: '90-90' },
    { perfil: dvh ? 6072 : 6035, desc: 'Parante central', formula: 'H-86',    cant: 4, corte: '90-90' },
    { perfil: dvh ? 6073 : 6061, desc: 'Zócalo/cabezal',  formula: '(A/4)-7', cant: 8, corte: '90-90' },
    { perfil: dvh ? 6074 : 6062, desc: 'Zócalo alto',     formula: '(A/4)-7', cant: 4, corte: '90-90' },
    { perfil: dvh ? 5997 : 5996, desc: 'Travesaño hoja',  formula: '(A/4)-81',cant: 4, corte: '90-90' },
    { perfil: 5965,              desc: 'Encuentro central',formula: 'H-86',    cant: 1, corte: '90-90' },
  ], A, H)
}
function getPerfilesA30_VC3(A: number, H: number, dvh: boolean): PerfilItem[] {
  return mp([
    { perfil: 6079, desc: 'Jambas premarco',                  formula: 'H+37',     cant: 2, corte: '45-45' },
    { perfil: 6079, desc: 'Umbral/dintel premarco',           formula: 'A+37',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',             formula: 'H+54',     cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco',      formula: 'A+54',     cant: 2, corte: '45-45' },
    { perfil: 6080, desc: 'Jambas marco',                     formula: 'H',        cant: 2, corte: '90-90' },
    { perfil: 6081, desc: 'Umbral/dintel marco',              formula: 'A-47',     cant: 2, corte: '90-90' },
    { perfil: dvh ? 6071 : 6034, desc: 'Parante lateral',     formula: 'H-88',     cant: 2, corte: '90-90' },
    { perfil: dvh ? 6072 : 6035, desc: 'Parante central',     formula: 'H-88',     cant: 3, corte: '90-90' },
    { perfil: dvh ? 6073 : 6061, desc: 'Zócalo/cab laterales',formula: '(A/3)+7',  cant: 4, corte: '90-90' },
    { perfil: dvh ? 6073 : 6061, desc: 'Zócalo/cab central',  formula: '(A/3)+21', cant: 2, corte: '90-90' },
    { perfil: dvh ? 6074 : 6062, desc: 'Zócalo alto lat.',    formula: '(A/3)+7',  cant: 2, corte: '90-90' },
    { perfil: dvh ? 6074 : 6062, desc: 'Zócalo alto central', formula: '(A/3)+21', cant: 1, corte: '90-90' },
    { perfil: dvh ? 5997 : 5996, desc: 'Travesaño hoja',      formula: '(A/3)-75', cant: 3, corte: '90-90' },
  ], A, H)
}
function getPerfilesA30_VAR(A: number, H: number, dvh: boolean, dosHojas: boolean): PerfilItem[] {
  const hojaFormula = dosHojas ? '(A/2)-26' : 'A-47'
  const hojaCant = dosHojas ? 4 : 2
  return mp([
    { perfil: 6066, desc: 'Jambas premarco',             formula: 'H+37', cant: 2, corte: '45-45' },
    { perfil: 6066, desc: 'Umbral/dintel premarco',      formula: 'A+37', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+54', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+54', cant: 2, corte: '45-45' },
    { perfil: 6051, desc: 'Jambas marco',                formula: 'H',    cant: 2, corte: '45-45' },
    { perfil: 6051, desc: 'Umbral/dintel marco',         formula: 'A',    cant: 2, corte: '45-45' },
    { perfil: 6054, desc: 'Jambas hoja',                 formula: 'H-47', cant: dosHojas ? 4 : 2, corte: '45-45' },
    { perfil: 6054, desc: 'Zócalo/cabezal hoja',         formula: hojaFormula, cant: hojaCant, corte: '45-45' },
    ...(dosHojas ? [{ perfil: 6053, desc: 'Encuentro central', formula: 'H-112', cant: 1, corte: '90-90' }] : []),
  ], A, H)
}
function getPerfilesA30_VAC(A: number, H: number, dvh: boolean, dosHojas: boolean): PerfilItem[] {
  const hojaFormula = dosHojas ? '(A/2)-26' : 'A-47'
  const hojaCant = dosHojas ? 4 : 2
  return mp([
    { perfil: 6066, desc: 'Jambas premarco',             formula: 'H+37', cant: 2, corte: '45-45' },
    { perfil: 6066, desc: 'Umbral/dintel premarco',      formula: 'A+37', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+54', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+54', cant: 2, corte: '45-45' },
    { perfil: 6051, desc: 'Jambas marco',                formula: 'H',    cant: 2, corte: '45-45' },
    { perfil: 6051, desc: 'Umbral/dintel marco',         formula: 'A',    cant: 2, corte: '45-45' },
    { perfil: 6052, desc: 'Jambas hoja (curva)',         formula: 'H-47', cant: dosHojas ? 4 : 2, corte: '45-45' },
    { perfil: 6052, desc: 'Zócalo/cabezal hoja',         formula: hojaFormula, cant: hojaCant, corte: '45-45' },
    ...(dosHojas ? [{ perfil: 6053, desc: 'Encuentro central', formula: 'H-112', cant: 1, corte: '90-90' }] : []),
  ], A, H)
}
function getPerfilesA30_PR(A: number, H: number, dvh: boolean, dosHojas: boolean): PerfilItem[] {
  const hojaFCabezal = dosHojas ? '(A/2)-40' : 'A-74'
  const hojaCant = dosHojas ? 2 : 1
  return mp([
    { perfil: 6066, desc: 'Jambas premarco',    formula: 'H+19',        cant: 2,        corte: '45-90' },
    { perfil: 6066, desc: 'Dintel premarco',    formula: 'A+37',        cant: 1,        corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa prem.',  formula: 'H+27',        cant: 2,        corte: '45-45' },
    { perfil: 6206, desc: 'Dintel tapa prem.',  formula: 'A+54',        cant: 1,        corte: '45-45' },
    { perfil: 6040, desc: 'Jambas marco',       formula: 'H',           cant: 2,        corte: '45-90' },
    { perfil: 6040, desc: 'Dintel marco',       formula: 'A',           cant: 1,        corte: '45-45' },
    { perfil: 6041, desc: 'Jambas hoja',        formula: 'H-42',        cant: dosHojas ? 4 : 2, corte: '45-90' },
    { perfil: 6041, desc: 'Cabezal hoja',       formula: hojaFCabezal,  cant: hojaCant, corte: '45-45' },
    ...(dosHojas ? [{ perfil: 6044, desc: 'Encuentro central', formula: 'H-75', cant: 1, corte: '90-90' }] : []),
  ], A, H)
}
function getPerfilesA30_PF(A: number, H: number, _dvh: boolean): PerfilItem[] {
  return mp([
    { perfil: 6066, desc: 'Jambas premarco',             formula: 'H+37', cant: 2, corte: '45-45' },
    { perfil: 6066, desc: 'Umbral/dintel premarco',      formula: 'A+37', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa premarco',        formula: 'H+54', cant: 2, corte: '45-45' },
    { perfil: 6206, desc: 'Umbral/dintel tapa premarco', formula: 'A+54', cant: 2, corte: '45-45' },
    { perfil: 6055, desc: 'Jambas paño fijo',            formula: 'H',    cant: 2, corte: '45-45' },
    { perfil: 6055, desc: 'Umbral/dintel paño fijo',     formula: 'A',    cant: 2, corte: '45-45' },
  ], A, H)
}
function getPerfilesA30_PV(A: number, H: number, dvh: boolean, dosHojas: boolean): PerfilItem[] {
  const hFCabezal = dosHojas ? '(A/2)-70' : 'A-124'
  const hFZocalo  = dosHojas ? '(A/2)-212' : 'A-266'
  return mp([
    { perfil: 6066, desc: 'Jambas premarco',         formula: 'H+19',    cant: 2,               corte: '45-90' },
    { perfil: 6066, desc: 'Dintel premarco',         formula: 'A+37',    cant: 1,               corte: '45-45' },
    { perfil: 6206, desc: 'Jambas tapa prem.',       formula: 'H+27',    cant: 2,               corte: '45-45' },
    { perfil: 6206, desc: 'Dintel tapa prem.',       formula: 'A+54',    cant: 1,               corte: '45-45' },
    { perfil: 6076, desc: 'Jambas marco',            formula: 'H',       cant: 2,               corte: '45-90' },
    { perfil: 6076, desc: 'Dintel marco',            formula: 'A',       cant: 1,               corte: '45-45' },
    { perfil: 6075, desc: 'Jambas hoja',             formula: 'H-71',    cant: dosHojas ? 4 : 2, corte: '45-45' },
    { perfil: 6075, desc: 'Zócalo/cabezal hoja',     formula: hFCabezal, cant: dosHojas ? 4 : 1, corte: '45-45' },
    { perfil: 6042, desc: 'Zócalo alto hoja',        formula: hFZocalo,  cant: dosHojas ? 2 : 1, corte: '90-90' },
    { perfil: 6077, desc: 'Complemento vert. marco', formula: 'H-33',    cant: 2,               corte: '45-90' },
    { perfil: 6077, desc: 'Complemento horiz. marco',formula: 'A-66',    cant: 1,               corte: '45-45' },
  ], A, H)
}

// ── Herrero ────────────────────────────────────────────────────
function getPerfilesHERRERO_VC(A: number, H: number): PerfilItem[] {
  return mp([
    { perfil: 101, desc: 'Jambas marco',        formula: 'H',        cant: 2, corte: '90-90' },
    { perfil: 101, desc: 'Umbral/dintel marco', formula: 'A-42',     cant: 2, corte: '90-90' },
    { perfil: 103, desc: 'Parante lateral',     formula: 'H-81',     cant: 2, corte: '90-90' },
    { perfil: 104, desc: 'Parante central',     formula: 'H-81',     cant: 1, corte: '90-90' },
    { perfil: 102, desc: 'Zócalo/cabezal hoja', formula: '(A/2)-26', cant: 4, corte: '90-90' },
    { perfil: 105, desc: 'Hoja mosquitero',     formula: 'H-81',     cant: 1, corte: '90-90' },
    { perfil: 822, desc: 'Batinete mosquitero', formula: '(A/2)-26', cant: 2, corte: '90-90' },
  ], A, H)
}
function getPerfilesHERRERO_VC3(A: number, H: number): PerfilItem[] {
  return mp([
    { perfil: 691, desc: 'Jambas marco 3 guías',     formula: 'H',       cant: 2, corte: '90-90' },
    { perfil: 691, desc: 'Umbral/dintel marco 3g',   formula: 'A-42',    cant: 2, corte: '90-90' },
    { perfil: 103, desc: 'Parante lateral',          formula: 'H-83',    cant: 2, corte: '90-90' },
    { perfil: 104, desc: 'Parante central',          formula: 'H-83',    cant: 2, corte: '90-90' },
    { perfil: 102, desc: 'Zócalo/cab hojas lat.',    formula: '(A/3)-7', cant: 4, corte: '90-90' },
    { perfil: 102, desc: 'Zócalo/cab hoja central',  formula: '(A/3)+1', cant: 2, corte: '90-90' },
    { perfil: 105, desc: 'Hoja mosquitero',          formula: 'H-83',    cant: 1, corte: '90-90' },
  ], A, H)
}
function getPerfilesHERRERO_VC4(A: number, H: number): PerfilItem[] {
  return mp([
    { perfil: 58,  desc: 'Jambas marco 4 guías',     formula: 'H',        cant: 2, corte: '90-90' },
    { perfil: 58,  desc: 'Umbral/dintel marco 4g',   formula: 'A-42',     cant: 2, corte: '90-90' },
    { perfil: 103, desc: 'Parante lateral',          formula: 'H-81',     cant: 4, corte: '90-90' },
    { perfil: 104, desc: 'Parante central',          formula: 'H-81',     cant: 4, corte: '90-90' },
    { perfil: 102, desc: 'Zócalo/cabezal hoja',      formula: '(A/4)-13', cant: 8, corte: '90-90' },
    { perfil: 105, desc: 'Hoja mosquitero',          formula: 'H-81',     cant: 2, corte: '90-90' },
  ], A, H)
}
function getPerfilesHERRERO_PR(A: number, H: number, dosHojas: boolean): PerfilItem[] {
  const hojaA = dosHojas ? '(A/2)-20' : 'A-39'
  const hojaCant = dosHojas ? 4 : 2
  return mp([
    { perfil: 39,     desc: 'Jambas marco puerta',  formula: 'H',    cant: 2,        corte: '45-45' },
    { perfil: 39,     desc: 'Dintel/umbral marco',  formula: 'A-40', cant: 2,        corte: '45-45' },
    { perfil: 'PP36', desc: 'Parante puerta 36',    formula: 'H-42', cant: hojaCant, corte: '45-90' },
    { perfil: 'TP36', desc: 'Travesaño puerta 36',  formula: hojaA,  cant: hojaCant, corte: '90-90' },
    ...(dosHojas ? [
      { perfil: 40, desc: 'Doble contacto 36mm', formula: 'H-42', cant: 2, corte: '90-90' },
      { perfil: 37, desc: 'Encuentro puerta',    formula: 'H-42', cant: 1, corte: '90-90' },
    ] : []),
  ], A, H)
}
function getPerfilesHERRERO_PF(A: number, H: number): PerfilItem[] {
  return mp([
    { perfil: 973, desc: 'Marco PF jambas',     formula: 'H',    cant: 2, corte: '45-45' },
    { perfil: 973, desc: 'Marco PF umbral',     formula: 'A-40', cant: 2, corte: '45-45' },
    { perfil: 108, desc: 'Contravidrio (4l)',    formula: 'H-30', cant: 2, corte: '45-45' },
    { perfil: 108, desc: 'Contravidrio (4l)',    formula: 'A-30', cant: 2, corte: '45-45' },
    { perfil: 107, desc: 'Perfil PF interior',  formula: 'H',    cant: 2, corte: '45-45' },
    { perfil: 107, desc: 'Perfil PF interior',  formula: 'A-40', cant: 2, corte: '45-45' },
  ], A, H)
}

// ── Vidrio ─────────────────────────────────────────────────────
export function calcularVidrio(tipologia: string, A: number, H: number, dvh: boolean, linea?: Linea): VidrioResult {
  const paneles: { nombre: string; ancho: number; alto: number }[] = []
  const esCorrediza = ['VC', 'PC', 'VC4', 'PC4', 'VC3', 'PC3'].includes(tipologia)
  const esAbrir = ['VAR', 'VAC', 'VAR2', 'VAC2', 'VADCR'].includes(tipologia)
  const esPuertaRebatir = ['PR', 'PR2'].includes(tipologia)
  const esPF = tipologia === 'PF'
  const esPV = ['PV', 'PV2'].includes(tipologia)

  if (esCorrediza) {
    const nHojas = tipologia.includes('4') ? 4 : tipologia.includes('3') ? 3 : 2
    if (nHojas === 2 && (!linea || linea === 'MODENA')) {
      const panelA = dvh ? Math.round(A / 2) - 57 : Math.round(A / 2) - 62
      const panelH = dvh ? H - 168 : H - 173
      paneles.push({ nombre: 'Panel hoja 1', ancho: panelA, alto: panelH })
      paneles.push({ nombre: 'Panel hoja 2', ancho: panelA, alto: panelH })
    } else {
      const divisor = nHojas === 4 ? 4 : nHojas === 3 ? 3 : 2
      const panelA = Math.round((A - 52) / divisor) - 50
      const panelH = H - 120
      for (let i = 0; i < nHojas; i++) paneles.push({ nombre: `Panel ${i + 1}`, ancho: panelA, alto: panelH })
    }
  } else if (esAbrir) {
    const dosHojas = tipologia.includes('2')
    if (dosHojas) {
      const panelA = Math.round(A / 2) - 60
      paneles.push({ nombre: 'Hoja izquierda', ancho: panelA, alto: H - 90 })
      paneles.push({ nombre: 'Hoja derecha',   ancho: panelA, alto: H - 90 })
    } else {
      paneles.push({ nombre: 'Hoja única', ancho: A - 90, alto: H - 90 })
    }
  } else if (esPuertaRebatir) {
    const dosHojas = tipologia === 'PR2'
    if (dosHojas) {
      const panelA = Math.round(A / 2) - 100
      paneles.push({ nombre: 'Hoja izquierda', ancho: panelA, alto: H - 120 })
      paneles.push({ nombre: 'Hoja derecha',   ancho: panelA, alto: H - 120 })
    } else {
      paneles.push({ nombre: 'Hoja única', ancho: A - 160, alto: H - 100 })
    }
  } else if (esPF) {
    paneles.push({ nombre: 'Paño fijo', ancho: A - 60, alto: H - 60 })
  } else if (esPV) {
    const dosHojas = tipologia === 'PV2'
    if (dosHojas) {
      const panelA = Math.round(A / 2) - 110
      paneles.push({ nombre: 'Hoja izquierda', ancho: panelA, alto: H - 150 })
      paneles.push({ nombre: 'Hoja derecha',   ancho: panelA, alto: H - 150 })
    } else {
      paneles.push({ nombre: 'Hoja única', ancho: A - 180, alto: H - 150 })
    }
  }

  const totalM2 = Math.round(paneles.reduce((s, p) => s + (p.ancho * p.alto) / 1e6, 0) * 100) / 100
  return { paneles, totalM2 }
}

// ── Tubulares ──────────────────────────────────────────────────
export const TUBULARES = [
  { codigo: 'N°47', linea: 'universal', desc: 'Tubular Hueco Liso Para Puerta (cubre 100mm)',        tipo: 'tubular',  superficieCoberturaMm: 100,   pesoKgM: 0.7803,  largoBarra: 6050 },
  { codigo: 'N°46', linea: 'universal', desc: 'Tablilla Liviana Sólida Acanalada (cubre 81.56mm)',   tipo: 'tablilla', superficieCoberturaMm: 81.56, pesoKgM: 0.36315, largoBarra: 6050 },
]
export function calcularTubulares(anchoPanel: number, altoPanel: number, tubular: typeof TUBULARES[0]): TubularInfo {
  const cantTiras = Math.ceil(altoPanel / tubular.superficieCoberturaMm)
  const totalMm   = anchoPanel * cantTiras
  const barras    = Math.ceil(totalMm / tubular.largoBarra)
  return {
    codigo: tubular.codigo, desc: tubular.desc,
    anchoMm: anchoPanel, coberturaMm: tubular.superficieCoberturaMm,
    cantidad: cantTiras, totalMm, barras,
    pesoKgM: tubular.pesoKgM, largoBarra: tubular.largoBarra,
    kgUtilizar: Math.round((anchoPanel / 1000) * tubular.pesoKgM * cantTiras * 100) / 100,
    kgComprar:  Math.round(barras * (tubular.largoBarra / 1000) * tubular.pesoKgM * 100) / 100,
  }
}

// ── Función principal ──────────────────────────────────────────
export function calcularAbertura(params: ParametrosCalculo): ResultadoCalculo {
  const { linea, tipologia, A, H, dvh = false, relleno = 'vidrio', tubularCodigo = null,
    tipoBorde = 'recto', conTravesano = false, conVidrioRepartido = false, tipoSistema = 'camara_compensadora' } = params

  let perfiles: PerfilItem[] = []

  if (linea === 'MODENA') {
    if      (tipologia === 'VC'  || tipologia === 'PC')  perfiles = getPerfilesMODENA_VC(A, H, dvh)
    else if (tipologia === 'VC4' || tipologia === 'PC4') perfiles = getPerfilesMODENA_VC4(A, H, dvh)
    else if (tipologia === 'VC3' || tipologia === 'PC3') perfiles = getPerfilesMODENA_VC3(A, H, dvh)
    else if (tipologia === 'VAR')    perfiles = getPerfilesMODENA_VAR(A, H, dvh, false, tipoBorde)
    else if (tipologia === 'VAR2')   perfiles = getPerfilesMODENA_VAR(A, H, dvh, true,  tipoBorde)
    else if (tipologia === 'VAC')    perfiles = getPerfilesMODENA_VAR(A, H, dvh, false, 'curvo')
    else if (tipologia === 'VAC2')   perfiles = getPerfilesMODENA_VAR(A, H, dvh, true,  'curvo')
    else if (tipologia === 'VADCR')  perfiles = getPerfilesMODENA_VADCR(A, H, dvh, false, tipoBorde)
    else if (tipologia === 'VADCR2') perfiles = getPerfilesMODENA_VADCR(A, H, dvh, true,  tipoBorde)
    else if (tipologia === 'BAN' || tipologia === 'VTL') {
      perfiles = tipoSistema === 'doble_contacto'
        ? getPerfilesMODENA_VADCR(A, H, dvh, false, tipoBorde)
        : getPerfilesMODENA_VAR(A, H, dvh, false, tipoBorde)
    }
    else if (tipologia === 'PF') perfiles = getPerfilesMODENA_PF(A, H, dvh, { tipoBorde, conTravesano, conVidrioRepartido })
    else if (tipologia === 'PR')  perfiles = getPerfilesMODENA_PR(A, H, dvh, false, conTravesano)
    else if (tipologia === 'PR2') perfiles = getPerfilesMODENA_PR(A, H, dvh, true,  conTravesano)
  } else if (linea === 'A30 New') {
    if      (tipologia === 'VC'  || tipologia === 'PC')  perfiles = getPerfilesA30_VC(A, H, dvh)
    else if (tipologia === 'VC4' || tipologia === 'PC4') perfiles = getPerfilesA30_VC4(A, H, dvh)
    else if (tipologia === 'VC3' || tipologia === 'PC3') perfiles = getPerfilesA30_VC3(A, H, dvh)
    else if (tipologia === 'VAR')  perfiles = getPerfilesA30_VAR(A, H, dvh, false)
    else if (tipologia === 'VAR2') perfiles = getPerfilesA30_VAR(A, H, dvh, true)
    else if (tipologia === 'VAC')  perfiles = getPerfilesA30_VAC(A, H, dvh, false)
    else if (tipologia === 'VAC2') perfiles = getPerfilesA30_VAC(A, H, dvh, true)
    else if (tipologia === 'PR')   perfiles = getPerfilesA30_PR(A, H, dvh, false)
    else if (tipologia === 'PR2')  perfiles = getPerfilesA30_PR(A, H, dvh, true)
    else if (tipologia === 'PF')   perfiles = getPerfilesA30_PF(A, H, dvh)
    else if (tipologia === 'PV')   perfiles = getPerfilesA30_PV(A, H, dvh, false)
    else if (tipologia === 'PV2')  perfiles = getPerfilesA30_PV(A, H, dvh, true)
  } else if (linea === 'Herrero') {
    if      (tipologia === 'VC'  || tipologia === 'PC')  perfiles = getPerfilesHERRERO_VC(A, H)
    else if (tipologia === 'VC3' || tipologia === 'PC3') perfiles = getPerfilesHERRERO_VC3(A, H)
    else if (tipologia === 'VC4' || tipologia === 'PC4') perfiles = getPerfilesHERRERO_VC4(A, H)
    else if (tipologia === 'PR')  perfiles = getPerfilesHERRERO_PR(A, H, false)
    else if (tipologia === 'PR2') perfiles = getPerfilesHERRERO_PR(A, H, true)
    else if (tipologia === 'PF')  perfiles = getPerfilesHERRERO_PF(A, H)
  }

  const pesos: Record<number | string, number> =
    linea === 'MODENA' ? PESOS_MODENA : linea === 'Herrero' ? PESOS_HERRERO : PESOS_A30

  // Agrupar perfiles iguales
  const mapa: Record<string, PerfilItem & { cantTotal: number }> = {}
  perfiles.forEach(p => {
    const key = `${p.perfil}_${p.medida}`
    if (!mapa[key]) mapa[key] = { ...p, cantTotal: 0 }
    mapa[key].cantTotal += p.cant
    if (!mapa[key].desc.includes(p.desc)) mapa[key].desc += ` / ${p.desc}`
  })

  const lista: PerfilCalculado[] = Object.values(mapa).map(p => {
    const pesoKgM      = (pesos as Record<string | number, number>)[p.perfil] ?? 0
    const medidaMm     = p.medida
    const metrosUtil   = medidaMm !== null ? (medidaMm * p.cantTotal) / 1000 : 0
    const kgUtilizar   = Math.round(metrosUtil * pesoKgM * 100) / 100
    const barras       = medidaMm !== null ? Math.ceil((medidaMm * p.cantTotal) / BARRA_MM) : 0
    const metrosComprar= Math.round(barras * (BARRA_MM / 1000) * 100) / 100
    const kgComprar    = Math.round(metrosComprar * pesoKgM * 100) / 100
    const kgDeposito   = Math.round((kgComprar - kgUtilizar) * 100) / 100
    return {
      perfil: p.perfil, desc: p.desc, medidaMm,
      cantidad: p.cantTotal, corte: p.corte,
      metrosUtilizar: Math.round(metrosUtil * 100) / 100,
      metrosComprar, barras, pesoKgM,
      kgUtilizar, kgComprar, kgDeposito,
      kgTotales: kgUtilizar,
      nota: p.nota,
    }
  })

  const totalKgUtilizar = Math.round(lista.reduce((s, p) => s + p.kgUtilizar, 0) * 100) / 100
  const totalKgComprar  = Math.round(lista.reduce((s, p) => s + p.kgComprar,  0) * 100) / 100
  const totalKgDeposito = Math.round(lista.reduce((s, p) => s + p.kgDeposito, 0) * 100) / 100
  const vidrio          = calcularVidrio(tipologia, A, H, dvh, linea)

  let tubularInfo: TubularInfo[] | null = null
  if (tubularCodigo) {
    const tub = TUBULARES.find(t => t.codigo === tubularCodigo)
    if (tub && vidrio.paneles.length > 0) {
      tubularInfo = vidrio.paneles.map(panel => calcularTubulares(panel.ancho, panel.alto, tub))
    }
  }

  return { lista, totalKgUtilizar, totalKgComprar, totalKgDeposito, totalKg: totalKgUtilizar, vidrio, relleno, tubularInfo }
}
