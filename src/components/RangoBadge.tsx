import RangoIcon from '@/components/ui/RangoIcon'

const RANGOS: Record<string, { label: string; color: string }> = {
  estrella_1: { label: '1 Estrella',  color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  estrella_2: { label: '2 Estrellas', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  estrella_3: { label: '3 Estrellas', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  estrella_4: { label: '4 Estrellas', color: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
  estrella_5: { label: '5 Estrellas', color: 'bg-amber-100 text-amber-800 border border-amber-300' },
  zafiro:     { label: 'Zafiro',      color: 'bg-[var(--surface)] text-[var(--primary-mid)] border border-sky-200' },
  rubi:       { label: 'Rubí',        color: 'bg-red-50 text-red-700 border border-red-200' },
  esmeralda:  { label: 'Esmeralda',   color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  diamante:   { label: 'Diamante',    color: 'bg-sky-50 text-sky-700 border border-sky-200 ring-1 ring-sky-300' },
}

interface RangoBadgeProps {
  rango: string
  size?: 'sm' | 'md'
}

export default function RangoBadge({ rango, size = 'sm' }: RangoBadgeProps) {
  const r = RANGOS[rango] || RANGOS['estrella_1']
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full ${r.color} ${
      size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'
    }`}>
      <RangoIcon rango={rango} size="sm" />
      {r.label}
    </span>
  )
}
