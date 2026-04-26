'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import type { Perfil } from '@/types/perfil'

interface Props {
  perfil: Perfil
}

export default function MercadoPagoConnect({ perfil }: Props) {
  const searchParams = useSearchParams()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    const connected = searchParams.get('mp_connected')
    const error = searchParams.get('mp_error')
    if (connected === 'true') {
      setFeedback({ type: 'success', msg: 'Cuenta de Mercado Pago vinculada correctamente.' })
    } else if (error) {
      const msgs: Record<string, string> = {
        sin_codigo: 'No se recibió el código de autorización.',
        token_fallido: 'No se pudo obtener el token de MP. Intentá de nuevo.',
        guardado_fallido: 'Token obtenido pero no se pudo guardar. Contactá soporte.',
        state_invalido: 'Error de seguridad en la autorización.',
        configuracion_incompleta: 'Configuración del servidor incompleta.',
        error_interno: 'Error interno. Intentá más tarde.',
      }
      setFeedback({ type: 'error', msg: msgs[error] ?? `Error: ${error}` })
    }
  }, [searchParams])

  const yaConectado = Boolean(perfil.mp_user_id)

  return (
    <div className="pt-4 border-t border-slate-100 space-y-3">
      <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Mercado Pago</p>

      {feedback && (
        <div className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback.type === 'success'
            ? <CheckCircle size={14} className="shrink-0 mt-0.5" />
            : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
          {feedback.msg}
        </div>
      )}

      {yaConectado ? (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Cuenta MP vinculada</p>
            <p className="text-xs text-green-600">ID: {perfil.mp_user_id}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
          <p className="text-sm text-slate-600">
            Vinculá tu cuenta de Mercado Pago para recibir pagos directamente cuando el cliente libere los fondos.
          </p>
          <a
            href="/api/mercadopago/connect"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#009ee3] hover:bg-[#007eb3] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <ExternalLink size={14} />
            Conectar Mercado Pago
          </a>
        </div>
      )}
    </div>
  )
}
