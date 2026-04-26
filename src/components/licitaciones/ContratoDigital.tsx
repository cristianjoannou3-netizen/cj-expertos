'use client'
import { useState } from 'react'
import { CheckCircle, FileSignature } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FirmaCanvas from '@/components/licitaciones/FirmaCanvas'
import { createClient } from '@/lib/supabase/client'
import type { ContratoFirma, Licitacion } from '@/types/licitacion'
import type { Perfil } from '@/types/perfil'

interface Props {
  licitacion: Licitacion
  contratos: ContratoFirma[]
  perfil: Perfil
  carpinteroElegidoId: string | null
  onRefresh: () => void
}

export default function ContratoDigital({
  licitacion,
  contratos,
  perfil,
  carpinteroElegidoId,
  onRefresh,
}: Props) {
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [firmaImagenUrl, setFirmaImagenUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const firmaCliente = contratos.find(c => c.firmante_id === licitacion.cliente_id)
  const firmaCarpintero = contratos.find(
    c => carpinteroElegidoId && c.firmante_id === carpinteroElegidoId
  )
  const contratoCompleto = Boolean(firmaCliente && firmaCarpintero)

  const yaFirmo = contratos.find(c => c.firmante_id === perfil.id)
  const puedeFirear = !yaFirmo && (
    perfil.id === licitacion.cliente_id ||
    perfil.id === carpinteroElegidoId
  )

  const handleFirmar = async () => {
    setError('')
    if (!nombre.trim() || nombre.trim().length < 5)
      return setError('Ingresá tu nombre completo (nombre y apellido).')
    if (!dni.trim() || dni.trim().length < 7)
      return setError('Ingresá un DNI válido (mínimo 7 dígitos).')
    if (!firmaImagenUrl)
      return setError('Dibujá y confirmá tu firma manuscrita.')
    if (!acepta)
      return setError('Debés aceptar los términos del contrato.')

    setLoading(true)
    const { error: err } = await supabase.from('contrato_firma').upsert({
      licitacion_id: licitacion.id,
      firmante_id: perfil.id,
      nombre_completo: nombre.trim(),
      dni: dni.trim(),
      acepta_terminos: true,
      firma_imagen_url: firmaImagenUrl,
      firmado_en: new Date().toISOString(),
    })

    if (err) {
      setError(err.message)
    } else {
      // Notificar a la contraparte
      const destinatarioId =
        perfil.id === licitacion.cliente_id ? carpinteroElegidoId : licitacion.cliente_id
      const quienFirmo =
        perfil.id === licitacion.cliente_id ? 'El cliente' : 'El carpintero'
      if (destinatarioId) {
        await supabase.from('notificaciones').insert({
          usuario_id: destinatarioId,
          tipo: 'sistema',
          titulo: 'Contrato firmado por la contraparte',
          mensaje: `${quienFirmo} firmó el contrato para "${licitacion.titulo}".`,
          link: `/licitaciones/${licitacion.id}`,
        })
      }
      setNombre('')
      setDni('')
      setAcepta(false)
      setFirmaImagenUrl(null)
      onRefresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-[var(--card)] rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FileSignature size={18} className="text-[var(--primary)]" />
        <h3 className="font-bold text-slate-800 text-base">Contrato digital</h3>
      </div>

      {contratoCompleto && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle size={18} className="text-[var(--success)] shrink-0" />
          <p className="text-sm font-semibold text-[var(--success)]">
            Contrato firmado por ambas partes
          </p>
        </div>
      )}

      {/* Estado de firmas */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-3 border ${firmaCliente ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Cliente</p>
          {firmaCliente ? (
            <>
              <p className="text-sm font-bold text-[var(--success)] flex items-center gap-1">
                <CheckCircle size={13} /> Firmado
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{firmaCliente.nombre_completo}</p>
              {firmaCliente.firma_imagen_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firmaCliente.firma_imagen_url} alt="Firma cliente" className="mt-2 h-10 object-contain" />
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">Pendiente</p>
          )}
        </div>
        <div className={`rounded-xl p-3 border ${firmaCarpintero ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Carpintero</p>
          {firmaCarpintero ? (
            <>
              <p className="text-sm font-bold text-[var(--success)] flex items-center gap-1">
                <CheckCircle size={13} /> Firmado
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{firmaCarpintero.nombre_completo}</p>
              {firmaCarpintero.firma_imagen_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firmaCarpintero.firma_imagen_url} alt="Firma carpintero" className="mt-2 h-10 object-contain" />
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">Pendiente</p>
          )}
        </div>
      </div>

      {/* Formulario de firma */}
      {puedeFirear && !contratoCompleto && (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">Firmar contrato</h4>

          {error && (
            <p className="text-sm text-[var(--danger)] bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <Input
            label="Nombre completo"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
          />
          <Input
            label="DNI"
            value={dni}
            onChange={e => setDni(e.target.value)}
            placeholder="12345678"
            maxLength={10}
          />

          <FirmaCanvas
            licitacionId={licitacion.id}
            firmanteId={perfil.id}
            firmaGuardadaUrl={null}
            onConfirmar={(url) => setFirmaImagenUrl(url)}
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acepta}
              onChange={e => setAcepta(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[var(--primary)]"
            />
            <span className="text-sm text-slate-600">
              Acepto los términos y condiciones del contrato de obra, incluyendo el sistema de
              escrow y certificación de etapas de CJ Expertos.
            </span>
          </label>

          <Button
            onClick={handleFirmar}
            loading={loading}
            disabled={!nombre || !dni || !acepta || !firmaImagenUrl}
            className="w-full"
          >
            Firmar contrato
          </Button>
        </div>
      )}

      {yaFirmo && !contratoCompleto && (
        <p className="text-sm text-slate-500 text-center">
          Esperando que la contraparte firme el contrato...
        </p>
      )}
    </div>
  )
}
