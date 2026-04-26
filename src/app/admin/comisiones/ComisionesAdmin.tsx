'use client'
import { useMemo } from 'react'
import { Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import type { Movimiento } from '@/types/licitacion'

interface Props {
  comisiones: Movimiento[]
}

export default function ComisionesAdmin({ comisiones }: Props) {
  // Agrupar por mes
  const porMes = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of comisiones) {
      const fecha = new Date(c.created_at)
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      map[key] = (map[key] ?? 0) + c.monto
    }
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([mes, total]) => ({ mes, total }))
  }, [comisiones])

  const totalGeneral = comisiones.reduce((s, c) => s + c.monto, 0)

  function exportCSV() {
    const header = 'Fecha,Descripcion,Monto'
    const rows = comisiones.map(c =>
      [
        new Date(c.created_at).toLocaleDateString('es-AR'),
        `"${(c.descripcion ?? '').replace(/"/g, '""')}"`,
        c.monto.toFixed(2),
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comisiones-cj-expertos.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total comisiones</p>
          <p className="text-2xl font-black text-amber-600">${totalGeneral.toLocaleString('es-AR')}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Registros</p>
          <p className="text-2xl font-black text-slate-800">{comisiones.length}</p>
        </Card>
      </div>

      {/* Totales por mes */}
      {porMes.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-2">Totales por mes</h3>
          <Card padding="none">
            {porMes.map((m, i) => (
              <div key={m.mes} className={`flex justify-between items-center p-4 ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                <p className="font-semibold text-slate-700">{m.mes}</p>
                <p className="font-black text-amber-600">${m.total.toLocaleString('es-AR')}</p>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Tabla detalle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-700">Detalle de comisiones</h3>
          <Button size="sm" variant="outline" onClick={exportCSV} className="flex items-center gap-2">
            <Download size={14} /> Exportar CSV
          </Button>
        </div>

        <Card padding="none">
          {comisiones.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No hay comisiones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left p-4 font-semibold text-slate-600">Fecha</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Descripción</th>
                    <th className="text-right p-4 font-semibold text-slate-600">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {comisiones.map((c, i) => (
                    <tr key={c.id} className={`border-b border-slate-50 hover:bg-slate-50 ${i === comisiones.length - 1 ? 'border-none' : ''}`}>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(c.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}
                      </td>
                      <td className="p-4 text-slate-700 max-w-xs truncate">
                        {c.descripcion ?? 'Comisión plataforma'}
                      </td>
                      <td className="p-4 text-right font-bold text-amber-600">
                        ${c.monto.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
