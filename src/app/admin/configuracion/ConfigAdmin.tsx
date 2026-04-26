'use client'
import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import type { ConfigPlataforma } from '@/types/licitacion'

interface Props {
  config: ConfigPlataforma | null
}

export default function ConfigAdmin({ config }: Props) {
  const [comisionPct, setComisionPct] = useState(String(config?.comision_porcentaje ?? 5))
  const [comisionMin, setComisionMin] = useState(String(config?.comision_minima ?? 500))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()

  async function handleGuardar() {
    setError('')
    setSuccess('')
    const pct = parseFloat(comisionPct)
    const min = parseFloat(comisionMin)

    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError('El porcentaje debe estar entre 0 y 100')
      return
    }
    if (isNaN(min) || min < 0) {
      setError('La comisión mínima debe ser un valor positivo')
      return
    }

    setLoading(true)
    const { error: updateErr } = await supabase
      .from('config_plataforma')
      .update({ comision_porcentaje: pct, comision_minima: min })
      .eq('id', 1)

    if (updateErr) {
      setError(updateErr.message)
    } else {
      setSuccess('Configuración guardada correctamente.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <Card>
        <h2 className="text-base font-bold text-slate-800 mb-4">Comisión de plataforma</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Comisión (% sobre el monto total)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={comisionPct}
              onChange={e => setComisionPct(e.target.value)}
              placeholder="5.00"
            />
            <p className="text-xs text-slate-400 mt-1">
              Ejemplo: 5 = 5%. Se aplica sobre el monto total de la licitación al finalizar la obra.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Comisión mínima (ARS)
            </label>
            <Input
              type="number"
              min={0}
              step={50}
              value={comisionMin}
              onChange={e => setComisionMin(e.target.value)}
              placeholder="500.00"
            />
            <p className="text-xs text-slate-400 mt-1">
              Si el porcentaje resulta menor a este valor, se cobra este monto mínimo.
            </p>
          </div>

          {error && (
            <p className="text-sm text-[var(--danger)] bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-[var(--success)] bg-green-50 rounded-xl px-3 py-2 flex items-center gap-2">
              <CheckCircle size={14} /> {success}
            </p>
          )}

          <Button loading={loading} onClick={handleGuardar} className="w-full">
            Guardar configuración
          </Button>
        </div>
      </Card>
    </div>
  )
}
