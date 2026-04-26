'use client'
import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import type { EtapaCertificacion, Licitacion } from '@/types/licitacion'
import type { Perfil } from '@/types/perfil'

interface Props {
  licitacion: Licitacion
  etapas: EtapaCertificacion[]
  perfil: Perfil
  carpinteroElegidoId: string | null
  onRefresh: () => void
}

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', variant: 'neutral' as const, Icon: Clock },
  en_revision: { label: 'En revisión', variant: 'warning' as const, Icon: Upload },
  aprobada: { label: 'Aprobada', variant: 'success' as const, Icon: CheckCircle },
  disputada: { label: 'Disputada', variant: 'danger' as const, Icon: AlertTriangle },
}

export default function EtapasCertificacion({
  licitacion,
  etapas,
  perfil,
  carpinteroElegidoId,
  onRefresh,
}: Props) {
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [disputaModalId, setDisputaModalId] = useState<string | null>(null)
  const [motivoDisputa, setMotivoDisputa] = useState('')
  const [error, setError] = useState('')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const supabase = createClient()
  const isCliente = perfil.id === licitacion.cliente_id
  const isCarpinteroAdj = perfil.id === carpinteroElegidoId

  const aprobadas = etapas.filter(e => e.estado === 'aprobada').length
  const progreso = etapas.length > 0 ? Math.round((aprobadas / etapas.length) * 100) : 0

  const handleSubirFoto = async (etapa: EtapaCertificacion, file: File) => {
    setUploadingId(etapa.id)
    setError('')
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${licitacion.id}/${etapa.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('fotos-etapas')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('fotos-etapas')
        .getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('etapas_certificacion')
        .update({
          estado: 'en_revision',
          foto_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', etapa.id)

      if (updateError) throw updateError

      // Notificar al cliente
      await supabase.from('notificaciones').insert({
        usuario_id: licitacion.cliente_id,
        tipo: 'etapa',
        titulo: 'Etapa lista para revisión',
        mensaje: `La etapa "${etapa.nombre}" está lista para que la revises y apruebes.`,
        link: `/licitaciones/${licitacion.id}`,
      })

      onRefresh()
    } catch (e) {
      setError((e as Error).message)
    }
    setUploadingId(null)
  }

  const handleAprobar = async (etapa: EtapaCertificacion) => {
    setProcessingId(etapa.id)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('aprobar_etapa', {
      p_etapa_id: etapa.id,
      p_comentario: null,
    })
    if (rpcError || (data && !data.ok)) {
      setError(rpcError?.message ?? data?.mensaje ?? 'Error al aprobar etapa')
    } else {
      // Email al carpintero adjudicado (fire-and-forget)
      if (carpinteroElegidoId) {
        supabase.from('perfiles').select('email,nombre').eq('id', carpinteroElegidoId).single()
          .then(({ data: carpPerfil }) => {
            if (carpPerfil?.email) {
              fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tipo: 'etapa_aprobada',
                  datos: {
                    emailCarpintero: carpPerfil.email,
                    nombreCarpintero: carpPerfil.nombre,
                    etapaNombre: etapa.nombre,
                    licitacionTitulo: licitacion.titulo,
                    licitacionId: licitacion.id,
                  },
                }),
              }).catch(() => null)
            }
          })
      }
      onRefresh()
    }
    setProcessingId(null)
  }

  const handleDisputar = async () => {
    if (!disputaModalId || !motivoDisputa.trim()) return
    setProcessingId(disputaModalId)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('rechazar_etapa', {
      p_etapa_id: disputaModalId,
      p_motivo: motivoDisputa.trim(),
    })
    if (rpcError || (data && !data.ok)) {
      setError(rpcError?.message ?? data?.mensaje ?? 'Error al disputar etapa')
    } else {
      setDisputaModalId(null)
      setMotivoDisputa('')
      onRefresh()
    }
    setProcessingId(null)
  }

  if (etapas.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-2xl shadow-sm p-5">
        <h3 className="font-bold text-slate-800 mb-2">Etapas de certificación</h3>
        <p className="text-sm text-slate-400 text-center py-4">
          Las etapas se configuran al iniciar la obra.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--card)] rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Etapas de certificación</h3>
        <span className="text-sm font-semibold text-slate-500">{aprobadas}/{etapas.length} aprobadas</span>
      </div>

      {/* Barra de progreso */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--success)] rounded-full transition-all duration-500"
          style={{ width: `${progreso}%` }}
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {etapas.map((etapa, idx) => {
          const cfg = ESTADO_CONFIG[etapa.estado]
          const { Icon } = cfg
          const isLast = idx === etapas.length - 1

          return (
            <div key={etapa.id} className="flex gap-3">
              {/* Línea vertical */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  etapa.estado === 'aprobada' ? 'bg-green-100' :
                  etapa.estado === 'disputada' ? 'bg-red-100' :
                  etapa.estado === 'en_revision' ? 'bg-amber-100' : 'bg-slate-100'
                }`}>
                  <Icon size={14} className={
                    etapa.estado === 'aprobada' ? 'text-[var(--success)]' :
                    etapa.estado === 'disputada' ? 'text-[var(--danger)]' :
                    etapa.estado === 'en_revision' ? 'text-amber-600' : 'text-slate-400'
                  } />
                </div>
                {!isLast && <div className="w-0.5 h-full bg-slate-100 my-1" />}
              </div>

              {/* Contenido */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{etapa.nombre}</p>
                    <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                  </div>
                </div>

                {/* Foto preview */}
                {etapa.foto_url && (
                  <a href={etapa.foto_url} target="_blank" rel="noopener noreferrer" className="block mt-2 mb-3">
                    <img
                      src={etapa.foto_url}
                      alt={`Foto etapa ${etapa.nombre}`}
                      className="w-full max-h-48 object-cover rounded-xl border border-slate-100 hover:opacity-90 transition-opacity"
                    />
                  </a>
                )}

                {/* Comentarios */}
                {etapa.comentario_carpintero && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mb-2">
                    <span className="font-semibold">Carpintero:</span> {etapa.comentario_carpintero}
                  </p>
                )}
                {etapa.comentario_cliente && (
                  <p className={`text-xs rounded-lg px-3 py-2 mb-2 ${
                    etapa.estado === 'disputada'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-green-50 text-green-700'
                  }`}>
                    <span className="font-semibold">Cliente:</span> {etapa.comentario_cliente}
                  </p>
                )}

                {/* Acciones carpintero */}
                {isCarpinteroAdj && etapa.estado === 'pendiente' && (
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={el => { fileRefs.current[etapa.id] = el }}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) handleSubirFoto(etapa, f)
                      }}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      loading={uploadingId === etapa.id}
                      onClick={() => fileRefs.current[etapa.id]?.click()}
                    >
                      <Upload size={13} /> Subir foto y enviar a revisión
                    </Button>
                  </div>
                )}

                {isCarpinteroAdj && etapa.estado === 'disputada' && (
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={el => { fileRefs.current[`re-${etapa.id}`] = el }}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) handleSubirFoto(etapa, f)
                      }}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={uploadingId === etapa.id}
                      onClick={() => fileRefs.current[`re-${etapa.id}`]?.click()}
                    >
                      <Upload size={13} /> Reenviar con nueva foto
                    </Button>
                  </div>
                )}

                {/* Acciones cliente */}
                {isCliente && etapa.estado === 'en_revision' && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      loading={processingId === etapa.id}
                      onClick={() => handleAprobar(etapa)}
                    >
                      <CheckCircle size={13} /> Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => { setDisputaModalId(etapa.id); setMotivoDisputa('') }}
                    >
                      <AlertTriangle size={13} /> Disputar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de disputa */}
      <Modal
        open={Boolean(disputaModalId)}
        onClose={() => { setDisputaModalId(null); setMotivoDisputa('') }}
        title="Disputar etapa"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Explicá el motivo del rechazo. El carpintero recibirá una notificación para reenviar evidencia.
          </p>
          <textarea
            value={motivoDisputa}
            onChange={e => setMotivoDisputa(e.target.value)}
            rows={3}
            className="w-full bg-[var(--surface)] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
            placeholder="Ej: La foto no muestra la soldadura del ángulo..."
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              loading={processingId === disputaModalId}
              disabled={!motivoDisputa.trim()}
              onClick={handleDisputar}
              className="flex-1"
            >
              Confirmar disputa
            </Button>
            <Button variant="ghost" onClick={() => setDisputaModalId(null)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
