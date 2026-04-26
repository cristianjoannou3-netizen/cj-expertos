// ============================================================
// Sistema de rangos — CJ Expertos (migrado desde src/utils/ranks.js)
// 9 niveles: Estrella (1-5) → Gemas (6-9)
// Basado en puntos acumulados (mapeo 1:1 con obras completadas)
// ============================================================

export interface Rank {
  level: number
  nombre: string
  minPuntos: number
  type: 'star' | 'gem'
  stars?: number
  emoji?: string
  icono: string
  color: string
  bg: string
}

export interface RankResult extends Rank {
  siguiente: Rank | null
}

export interface ProgressResult {
  porcentaje: number
  puntosActuales: number
  puntosNecesarios: number | null
  puntosRestantes: number | null
}

export const RANKS: Rank[] = [
  { level: 1, nombre: '1 Estrella',  minPuntos: 0,   type: 'star', stars: 1, icono: '⭐',  color: '#F59E0B', bg: '#FEF3C7' },
  { level: 2, nombre: '2 Estrellas', minPuntos: 5,   type: 'star', stars: 2, icono: '⭐⭐', color: '#F59E0B', bg: '#FEF3C7' },
  { level: 3, nombre: '3 Estrellas', minPuntos: 15,  type: 'star', stars: 3, icono: '⭐⭐⭐', color: '#F59E0B', bg: '#FEF3C7' },
  { level: 4, nombre: '4 Estrellas', minPuntos: 30,  type: 'star', stars: 4, icono: '⭐⭐⭐⭐', color: '#F59E0B', bg: '#FEF3C7' },
  { level: 5, nombre: '5 Estrellas', minPuntos: 50,  type: 'star', stars: 5, icono: '⭐⭐⭐⭐⭐', color: '#F59E0B', bg: '#FEF3C7' },
  { level: 6, nombre: 'Zafiro',      minPuntos: 75,  type: 'gem',  emoji: '💎', icono: '💎', color: '#1A73E8', bg: '#DBEAFE' },
  { level: 7, nombre: 'Rubí',        minPuntos: 110, type: 'gem',  emoji: '🔴', icono: '🔴', color: '#D32F2F', bg: '#FEE2E2' },
  { level: 8, nombre: 'Esmeralda',   minPuntos: 160, type: 'gem',  emoji: '💚', icono: '💚', color: '#2E7D32', bg: '#DCFCE7' },
  { level: 9, nombre: 'Diamante',    minPuntos: 220, type: 'gem',  emoji: '💠', icono: '💠', color: '#7EC8E3', bg: '#E0F2FE' },
]

/**
 * Retorna el rango correspondiente a los puntos dados.
 * Incluye una referencia al siguiente rango (o null si es el máximo).
 */
export function getRank(puntos: number): RankResult {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (puntos >= r.minPuntos) rank = r
  }
  const siguiente = RANKS.find(r => r.level === rank.level + 1) ?? null
  return { ...rank, siguiente }
}

/**
 * Retorna el porcentaje de progreso hacia el siguiente rango (0-100).
 * Si ya está en el nivel máximo, retorna 100.
 */
export function getProgress(puntos: number): ProgressResult {
  const { minPuntos, siguiente } = getRank(puntos)

  if (!siguiente) {
    return {
      porcentaje: 100,
      puntosActuales: puntos,
      puntosNecesarios: null,
      puntosRestantes: null,
    }
  }

  const rango = siguiente.minPuntos - minPuntos
  const avance = puntos - minPuntos
  const porcentaje = Math.min(100, Math.round((avance / rango) * 100))

  return {
    porcentaje,
    puntosActuales: puntos,
    puntosNecesarios: siguiente.minPuntos,
    puntosRestantes: siguiente.minPuntos - puntos,
  }
}

/** Alias retrocompatible con el legacy (acepta obrasCompletadas = puntos). */
export const getRankByObras = (obrasCompletadas: number) => getRank(obrasCompletadas)

/** Orden descendente para rankings: mayor nivel = menor número → 10-level */
export const getRankOrder = (level: number) => 10 - level
