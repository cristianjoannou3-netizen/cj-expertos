'use client'
import { useState, useEffect, useMemo } from 'react'
import { CreditCard, CheckCircle, Clock, Loader2, Upload, Eye, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { LicitacionDetalle, Pago, Cotizacion } from '@/types/licitacion'
import type { Perfil } from '@/types/perfil'

interface Props {
  licitacion: LicitacionDetalle
  pagos: Pago[]
  cotizacion: Cotizacion | null
  perfil: Perfil
  carpintero: Perfil | null
  onRefresh: () => void
}

interface TramoInfo {
  tramo: 1 | 2 | 3
  label: string
  descripcion: string
  monto: number
  estado: 'pendiente' | 'pagado' | 'liberado' | 'no_disponible'
}

type MetodoPago = 'transferencia' | 'mercadopago'

const RECARGO_MP = 0.054 // 4.5% + IVA

function fmtARS(n: number) {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function TramoEstadoBadge({ estado }: { estado: TramoInfo['estado'] }) {
  const config = {
    pendiente:     { cls: 'bg-amber-50 text-amber-700 border-amber-200',  label: 'Pendiente' },
    pagado:        { cls: 'bg-[var(--surface)] text-[var(--primary-mid)] border-sky-200',     label: 'Pagado' },
    liberado:      { cls: 'bg-green-50 text-green-700 border-green-200',  label: 'Liberado' },
    no_disponible: { cls: 'bg-slate-50 text-slate-400 border-slate-200',  label: 'No disponible aún' },
  }[estado]

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.cls}`}>
      {config.label}
    </span>
  )
}

// Sub-componente para subir comprobante al bucket 'comprobantes'
function SubirComprobante({
  prefix,
  onUpload,
}: {
  prefix: string
  onUpload: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState(false)
  const supabase = createClient()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      setError('Solo se permiten imágenes (JPG, PNG, WebP) o PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10 MB.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const filePath = `${prefix}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('comprobantes')
        .upload(filePath, file, { contentType: file.type, upsert: false })
      if (uploadErr) throw new Error(uploadErr.message)
      const { data } = supabase.storage.from('comprobantes').getPublicUrl(filePath)
      setUploaded(true)
      onUpload(data.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el comprobante.')
    } finally {
      setUploading(false)
    }
  }

  if (uploaded) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2">
        <CheckCircle size={13} />
        Comprobante subido correctamente
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <label className="block">
        <div className={`flex items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 hover:border-[var(--accent)] transition-colors text-sm text-slate-600 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Subiendo...' : 'Subí tu comprobante (foto o PDF)'}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function PagoEscrow({ licitacion, pagos, cotizacion, perfil, carpintero, onRefresh }: Props) {
  const [loadingTramo, setLoadingTramo] = useState<number | null>(null)
  const [confirmandoTramo, setConfirmandoTramo] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('transferencia')
  // comprobantes pendientes por tramo antes de confirmar
  const [comprobantes, setComprobantes] = useState<Record<number, string>>({})
  const [enviandoTransferencia, setEnviandoTransferencia] = useState<number | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const isCliente = perfil.id === licitacion.cliente_id
  const isAdmin = perfil.rol === 'admin'

  // ¿El carpintero tiene cuenta MP conectada?
  const carpinteroTieneMP = Boolean(carpintero?.mp_user_id)

  // Leer payment_status de query param al volver de MP
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('payment_status')
    if (status) {
      setPaymentStatus(status)
      if (status === 'approved') {
        setMsg('Pago recibido por Mercado Pago. Los fondos quedan retenidos hasta la aprobación de la etapa.')
        onRefresh()
      } else if (status === 'failure') {
        setError('El pago fue rechazado. Podés intentar de nuevo.')
      } else if (status === 'pending') {
        setMsg('Tu pago está pendiente de acreditación.')
      }
    }
  }, [onRefresh])

  if (!cotizacion) return null
  if (!isCliente && !isAdmin) return null

  const monto = cotizacion.monto
  const tramo1Monto = Math.round(monto * 0.40 * 100) / 100
  const tramo2Monto = Math.round(monto * 0.60 * 100) / 100

  // Comisión de CJ Expertos: 5% del MONTO TOTAL, cobrada en el primer pago
  const comisionCJ = Math.round(monto * 0.05 * 100) / 100

  const yaPageado = (t: number) => pagos.some(p => p.tramo === t && (p.estado === 'confirmado' || p.estado === 'retenido' || p.estado === 'liberado'))
  const pagadoHasta = pagos.filter(p => (p.estado === 'confirmado' || p.estado === 'retenido' || p.estado === 'liberado') && p.tramo >= 2).reduce((s, p) => s + p.monto, 0)
  const tramo3Monto = Math.max(0, monto - pagadoHasta)

  const tramos: TramoInfo[] = [
    {
      tramo: 1,
      label: 'Tramo 1 — Anticipo',
      descripcion: '40% del monto cotizado. Confirma la adjudicación.',
      monto: tramo1Monto,
      estado: yaPageado(1) ? 'pagado'
        : licitacion.estado === 'adjudicada' || licitacion.estado === 'en_curso' || licitacion.estado === 'completada' ? 'pendiente'
        : 'no_disponible',
    },
    {
      tramo: 2,
      label: 'Tramo 2 — Materiales',
      descripcion: '60% del monto. Se libera al carpintero para compra de materiales.',
      monto: tramo2Monto,
      estado: yaPageado(2) ? 'liberado'
        : yaPageado(1) && (licitacion.estado === 'adjudicada' || licitacion.estado === 'en_curso') ? 'pendiente'
        : 'no_disponible',
    },
    {
      tramo: 3,
      label: 'Tramo 3 — Saldo Final',
      descripcion: 'Saldo restante al completar la obra. Requiere etapas aprobadas.',
      monto: tramo3Monto,
      estado: yaPageado(3) ? 'liberado'
        : licitacion.estado === 'en_curso' && yaPageado(2) ? 'pendiente'
        : 'no_disponible',
    },
  ]

  // ---- Pagar con MP ----
  async function handlePagarMP(tramo: 1 | 2 | 3, montoObra: number) {
    setLoadingTramo(tramo)
    setError('')
    setMsg('')
    const recargo = Math.round(montoObra * RECARGO_MP * 100) / 100
    const montoTotal = Math.round((montoObra + recargo) * 100) / 100
    try {
      const res = await fetch('/api/pagos/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licitacion_id: licitacion.id,
          monto: montoObra,
          monto_total: montoTotal,
          tramo,
        }),
      })
      const data = await res.json() as { init_point?: string; error?: string; carpintero_sin_mp?: boolean }
      if (!res.ok || !data.init_point) {
        setError(data.error ?? 'Error al crear el pago')
        return
      }
      window.location.href = data.init_point
    } catch {
      setError('Error de red al crear el pago')
    } finally {
      setLoadingTramo(null)
    }
  }

  // ---- Confirmar transferencia con comprobante ----
  async function handleEnviarTransferencia(tramo: 1 | 2 | 3, montoObra: number) {
    const comprobanteUrl = comprobantes[tramo]
    if (!comprobanteUrl) {
      setError('Debés subir el comprobante de transferencia antes de confirmar.')
      return
    }
    setEnviandoTransferencia(tramo)
    setError('')
    setMsg('')

    const { error: insertErr } = await supabase.from('pagos').insert({
      licitacion_id: licitacion.id,
      tramo,
      monto: montoObra,
      metodo: 'transferencia',
      estado: 'pendiente',
      comprobante_url: comprobanteUrl,
    })

    if (insertErr) {
      setError(insertErr.message)
      setEnviandoTransferencia(null)
      return
    }

    // Notificación al admin
    const { data: admins } = await supabase
      .from('perfiles')
      .select('id')
      .eq('rol', 'admin')
    if (admins && admins.length > 0) {
      await supabase.from('notificaciones').insert(
        admins.map(a => ({
          usuario_id: a.id,
          tipo: 'pago',
          titulo: 'Nuevo comprobante de transferencia',
          mensaje: `El cliente subió un comprobante para el tramo ${tramo} de la licitación ${licitacion.id.slice(0, 8)}.`,
          link: `/admin/pagos`,
        }))
      )
    }

    setMsg(`Comprobante enviado. El pago será confirmado por el administrador en breve.`)
    onRefresh()
    setEnviandoTransferencia(null)
  }

  // ---- Admin: confirmar manual ----
  async function handleConfirmarManual(tramo: 1 | 2 | 3, montoObra: number) {
    setConfirmandoTramo(tramo)
    setError('')
    setMsg('')

    const { error: insertErr } = await supabase.from('pagos').insert({
      licitacion_id: licitacion.id,
      tramo,
      monto: montoObra,
      metodo: 'transferencia',
      estado: 'confirmado',
    })

    if (insertErr) {
      setError(insertErr.message)
      setConfirmandoTramo(null)
      return
    }

    if (tramo === 2) {
      await supabase.rpc('liberar_60_porciento', { p_licitacion_id: licitacion.id })
    }

    setMsg(`Tramo ${tramo} confirmado manualmente.`)
    onRefresh()
    setConfirmandoTramo(null)
  }

  return (
    <div className="bg-[var(--card)] rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard size={18} className="text-[var(--accent)]" />
        <h3 className="font-bold text-slate-800">Pagos en Escrow</h3>
      </div>

      {paymentStatus === 'approved' && !msg && (
        <div className="text-sm text-[var(--success)] bg-green-50 rounded-xl px-3 py-2 flex items-center gap-2">
          <CheckCircle size={14} /> Pago aprobado por Mercado Pago. Los fondos quedan retenidos hasta la liberación.
        </div>
      )}
      {error && (
        <p className="text-sm text-[var(--danger)] bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}
      {msg && !error && (
        <p className="text-sm text-[var(--success)] bg-green-50 rounded-xl px-3 py-2 flex items-center gap-2">
          <CheckCircle size={14} /> {msg}
        </p>
      )}

      {/* Selector de método de pago — solo para el cliente */}
      {isCliente && (
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setMetodoPago('transferencia')}
            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${
              metodoPago === 'transferencia'
                ? 'bg-white shadow text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Transferencia bancaria
          </button>
          <button
            onClick={() => setMetodoPago('mercadopago')}
            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${
              metodoPago === 'mercadopago'
                ? 'bg-white shadow text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Mercado Pago
          </button>
        </div>
      )}

      {/* Datos bancarios del carpintero (solo transferencia + cliente) */}
      {isCliente && metodoPago === 'transferencia' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
          <p className="font-semibold text-slate-700 mb-1">Datos para la transferencia</p>
          {carpintero?.cbu ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-slate-500">Titular</span>
              <span className="font-medium text-slate-800">{carpintero.nombre}</span>
              {carpintero.cbu && (
                <>
                  <span className="text-slate-500">CBU</span>
                  <span className="font-medium text-slate-800 font-mono">{carpintero.cbu}</span>
                </>
              )}
              {carpintero.alias_bancario && (
                <>
                  <span className="text-slate-500">Alias</span>
                  <span className="font-medium text-slate-800 font-mono">{carpintero.alias_bancario}</span>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              El carpintero aún no cargó sus datos bancarios. Podés contactarlo para coordinar la transferencia.
            </div>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Transferís directo al carpintero. La comisión de CJ Expertos (5%) se factura por separado.
          </p>
        </div>
      )}

      {/* Aviso si el carpintero no tiene MP (modo MP seleccionado) */}
      {isCliente && metodoPago === 'mercadopago' && !carpinteroTieneMP && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>
            El carpintero aún no conectó su cuenta de Mercado Pago.
            Podés pagar por <button className="underline font-semibold" onClick={() => setMetodoPago('transferencia')}>transferencia bancaria</button> mientras tanto.
          </span>
        </div>
      )}

      <div className="space-y-3">
        {tramos.map(t => {
          const recargo = Math.round(t.monto * RECARGO_MP * 100) / 100
          const montoConRecargo = Math.round((t.monto + recargo) * 100) / 100
          // La comisión de CJ solo aplica visualmente en el primer tramo
          const esTramo1 = t.tramo === 1

          return (
            <div key={t.tramo} className="border border-slate-100 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{t.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.descripcion}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="font-black text-slate-800">{fmtARS(t.monto)}</p>
                  <TramoEstadoBadge estado={t.estado} />
                </div>
              </div>

              {/* Acciones para cliente */}
              {isCliente && t.estado === 'pendiente' && (
                <div className="space-y-3 mt-2">
                  {metodoPago === 'transferencia' ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">
                        Realizá la transferencia por <strong>{fmtARS(t.monto)}</strong> y subí el comprobante.
                      </p>
                      <SubirComprobante
                        prefix={`${licitacion.id}/tramo-${t.tramo}`}
                        onUpload={url => setComprobantes(prev => ({ ...prev, [t.tramo]: url }))}
                      />
                      <Button
                        size="sm"
                        loading={enviandoTransferencia === t.tramo}
                        disabled={!comprobantes[t.tramo]}
                        onClick={() => handleEnviarTransferencia(t.tramo, t.monto)}
                        className="w-full"
                      >
                        {enviandoTransferencia === t.tramo
                          ? <Loader2 size={14} className="animate-spin" />
                          : <CheckCircle size={14} />
                        }
                        Confirmar transferencia
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Desglose con recargo y comisión */}
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Monto del tramo</span>
                          <span>{fmtARS(t.monto)}</span>
                        </div>
                        {esTramo1 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Comisión CJ Expertos (5% del total de la obra)</span>
                            <span>{fmtARS(comisionCJ)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-amber-700">
                          <span>Recargo Mercado Pago (5.4%)</span>
                          <span>+ {fmtARS(recargo)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-amber-200">
                          <span>Total a pagar</span>
                          <span>{fmtARS(montoConRecargo)}</span>
                        </div>
                      </div>
                      {esTramo1 && (
                        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                          La comisión de CJ Expertos ({fmtARS(comisionCJ)}) se cobra en este primer pago.
                          Los tramos siguientes no tienen comisión adicional.
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        El pago se procesa de forma segura por Mercado Pago. Tu carpintero recibe el 95% directo en su cuenta. CJ Expertos cobra una comisión del 5% por el servicio.
                      </p>
                      <Button
                        size="sm"
                        loading={loadingTramo === t.tramo}
                        disabled={!carpinteroTieneMP}
                        onClick={() => handlePagarMP(t.tramo, t.monto)}
                        className="w-full mt-1"
                      >
                        {loadingTramo === t.tramo
                          ? <Loader2 size={14} className="animate-spin" />
                          : <CreditCard size={14} />
                        }
                        Pagar {fmtARS(montoConRecargo)} con Mercado Pago
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Botón confirmar manual para admin */}
              {isAdmin && t.estado === 'pendiente' && (
                <Button
                  size="sm"
                  variant="outline"
                  loading={confirmandoTramo === t.tramo}
                  onClick={() => handleConfirmarManual(t.tramo, t.monto)}
                  className="w-full mt-2"
                >
                  Confirmar pago manual (transferencia)
                </Button>
              )}

              {(t.estado === 'pagado' || t.estado === 'liberado') && (
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle size={13} className="text-[var(--success)]" />
                  <span className="text-xs text-[var(--success)] font-medium">
                    {t.estado === 'liberado' ? 'Fondos liberados al carpintero' : 'Pago confirmado — fondos retenidos en Mercado Pago'}
                  </span>
                </div>
              )}

              {t.estado === 'no_disponible' && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock size={13} className="text-slate-400" />
                  <span className="text-xs text-slate-400">
                    Disponible cuando se completen los pasos anteriores
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400">
        Los fondos son retenidos por Mercado Pago y liberados al carpintero cuando CJ Expertos aprueba cada etapa.
        La transferencia bancaria es gratuita; Mercado Pago aplica un recargo del 5.4%.
      </p>
    </div>
  )
}
