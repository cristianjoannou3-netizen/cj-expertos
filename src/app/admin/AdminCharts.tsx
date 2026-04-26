'use client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from 'recharts'
import Card from '@/components/ui/Card'

interface Props {
  chartEstados: { estado: string; cantidad: number }[]
  licitacionesPorSemana: { semana: string; cantidad: number }[]
}

const ESTADO_LABELS: Record<string, string> = {
  abierta:    'Abierta',
  adjudicada: 'Adjudicada',
  en_curso:   'En curso',
  completada: 'Completada',
  vencida:    'Vencida',
  cancelada:  'Cancelada',
}

export default function AdminCharts({ chartEstados, licitacionesPorSemana }: Props) {
  const dataEstados = chartEstados.map(d => ({
    estado: ESTADO_LABELS[d.estado] ?? d.estado,
    cantidad: d.cantidad,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <h3 className="text-sm font-bold text-slate-700 mb-4">Licitaciones por estado</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dataEstados} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="estado" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="cantidad" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-slate-700 mb-4">Licitaciones por semana (últ. 8 sem.)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={licitacionesPorSemana} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="cantidad"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--primary)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
