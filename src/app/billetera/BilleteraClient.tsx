'use client'
import { useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, Percent, ArrowDownCircle, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types/perfil'
import type { Movimiento } from '@/types/licitacion'

interface Props {
  perfil: Perfil
  movimientos: Movimiento[]
}

function TipoIcon({ tipo }: { tipo: string }) {
  if (tipo === 'credito') return <TrendingUp size={16} className="text-[var(--success)]" />
  if (tipo === 'comision') return <Percent size={16} className="text-amber-500" />
  return <TrendingDown size={16} className="text-[var(--danger)]" />
}

function TipoClase(tipo: string) {
  if (tipo === 'credito') return 'text-[var(--success)]'
  if (tipo === 'comision') return 'text-amber-600'
  return 'text-[var(--danger)]'
}

export default function BilleteraClient({ perfil, movimientos }: Props) {
  const [showRetiro, setShowRetiro] = useState(false)
  const [monto, setMonto] = useState('')
  const [cbu, setCbu] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()
  const esCarpintero = perfil.rol === 'carpintero'

  async function handleRetiro() {
    setError('')
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) {
      setError('Ingresá un monto válido')
      return
    }
    if (montoNum > perfil.saldo_billetera) {
      setError('El monto supera tu saldo disponible')
      return
    }
    if (!cbu.trim()) {
      setError('Ingresá tu CBU o alias')
      return
    }

    setLoading(true)
    const { error: insertErr } = await supabase.from('movimientos').insert({
      perfil_id: perfil.id,
      tipo: 'debito',
      monto: montoNum,
      descripcion: `Solicitud de retiro — CBU/Alias: ${cbu.trim()}`,
      cbu_alias: cbu.trim(),
      estado: 'pendiente',
    })

    if (insertErr) {
      setError(insertErr.message)
      setLoading(false)
      return
    }

    // Notificar a admin (insertar notificación genérica)
    await supabase.from('notificaciones').insert({
      usuario_id: perfil.id,
      tipo: 'sistema',
      titulo: 'Solicitud de retiro enviada',
      mensaje: `Tu solicitud de retiro de $${montoNum.toLocaleString('es-AR')} fue recibida y será procesada en breve.`,
      link: '/billetera',
    })

    setSuccess(`Solicitud de retiro de $${montoNum.toLocaleString('es-AR')} enviada. El equipo la procesará en breve.`)
    setShowRetiro(false)
    setMonto('')
    setCbu('')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Saldo */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Wallet size={20} className="text-[var(--success)]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Saldo disponible</p>
            <p className="text-3xl font-black text-[var(--success)]">
              ${(perfil.saldo_billetera ?? 0).toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        {success && (
          <div className="text-sm text-[var(--success)] bg-green-50 rounded-xl px-3 py-2 flex items-center gap-2 mb-3">
            <CheckCircle size={14} /> {success}
          </div>
        )}

        {esCarpintero && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => { setShowRetiro(true); setError(''); setSuccess('') }}
            className="flex items-center gap-2"
          >
            <ArrowDownCircle size={14} /> Solicitar retiro
          </Button>
        )}
      </Card>

      {/* Historial */}
      <div>
        <h3 className="text-base font-bold text-slate-700 mb-3">Historial de movimientos</h3>
        {movimientos.length === 0 ? (
          <Card padding="lg">
            <p className="text-slate-400 text-center">Aún no tenés movimientos.</p>
          </Card>
        ) : (
          <Card padding="none">
            {movimientos.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center justify-between p-4 ${i !== 0 ? 'border-t border-slate-100' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TipoIcon tipo={m.tipo} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {m.descripcion ?? m.tipo}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(m.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {m.estado === 'pendiente' && (
                        <span className="ml-2 text-amber-600 font-semibold">· Pendiente</span>
                      )}
                    </p>
                  </div>
                </div>
                <p className={`font-black text-sm shrink-0 ml-4 ${TipoClase(m.tipo)}`}>
                  {m.tipo === 'debito' ? '-' : '+'}${m.monto.toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Modal retiro */}
      <Modal open={showRetiro} onClose={() => setShowRetiro(false)} title="Solicitar retiro">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Saldo disponible: <strong>${(perfil.saldo_billetera ?? 0).toLocaleString('es-AR')}</strong>
          </p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Monto a retirar</label>
            <Input
              type="number"
              placeholder="0.00"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              min={1}
              max={perfil.saldo_billetera}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">CBU o Alias destino</label>
            <Input
              type="text"
              placeholder="mi.alias o 0000003100..."
              value={cbu}
              onChange={e => setCbu(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowRetiro(false)} className="flex-1">
              Cancelar
            </Button>
            <Button loading={loading} onClick={handleRetiro} className="flex-1">
              Solicitar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
