const ESTADOS: Record<string, { label: string; color: string }> = {
  borrador:    { label: 'Borrador',    color: 'bg-slate-100 text-slate-600' },
  cotizacion:  { label: 'Cotización',  color: 'bg-yellow-100 text-yellow-700' },
  acopio:      { label: 'Acopio',      color: 'bg-orange-100 text-orange-700' },
  fabricacion: { label: 'Fabricación', color: 'bg-sky-100 text-sky-700' },
  entrega:     { label: 'Entrega',     color: 'bg-purple-100 text-purple-700' },
  colocacion:  { label: 'Colocación',  color: 'bg-indigo-100 text-indigo-700' },
  finalizada:  { label: 'Finalizada',  color: 'bg-green-100 text-green-700' },
  cancelada:   { label: 'Cancelada',   color: 'bg-red-100 text-red-700' },
}

export default function EstadoBadge({ estado }: { estado: string }) {
  const e = ESTADOS[estado] || { label: estado, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${e.color}`}>{e.label}</span>
  )
}
