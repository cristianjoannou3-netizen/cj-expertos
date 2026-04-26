'use client'
import { useState, useEffect } from 'react'
import { Clock, FileText, Download } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { BadgeVariant } from '@/components/ui/Badge'
import type { Licitacion } from '@/types/licitacion'

interface Props {
  licitacion: Licitacion
}

const TIPO_LABEL: Record<string, { emoji: string; label: string }> = {
  solo_fabricacion: { emoji: '🏭', label: 'Solo fabricación — el cliente retira y coloca' },
  entrega: { emoji: '🚛', label: 'Con entrega a domicilio' },
  colocacion: { emoji: '🔧', label: 'Con entrega y colocación' },
  instalacion: { emoji: '🔧', label: 'Instalación' },
  reparacion: { emoji: '🛠', label: 'Reparación' },
  fabricacion: { emoji: '🏭', label: 'Fabricación' },
}

const ESTADO_BADGE: Record<string, BadgeVariant> = {
  abierta: 'info',
  adjudicada: 'warning',
  en_curso: 'warning',
  completada: 'success',
  vencida: 'neutral',
  cancelada: 'danger',
}

const ESTADO_LABEL: Record<string, string> = {
  abierta: 'Abierta',
  adjudicada: 'Adjudicada',
  en_curso: 'En curso',
  completada: 'Completada',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
}

function Countdown({ venceEn }: { venceEn: string }) {
  const [tiempo, setTiempo] = useState('')

  useEffect(() => {
    const calcular = () => {
      const diff = new Date(venceEn).getTime() - Date.now()
      if (diff <= 0) { setTiempo('Vencida'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTiempo(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`)
    }
    calcular()
    const id = setInterval(calcular, 1000)
    return () => clearInterval(id)
  }, [venceEn])

  return (
    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
      <Clock size={15} />
      <span className="text-sm font-medium">Vence en {tiempo}</span>
    </div>
  )
}

export default function DetalleCabecera({ licitacion }: Props) {
  const tipoInfo = licitacion.tipo_servicio ? TIPO_LABEL[licitacion.tipo_servicio] : null

  const handleDownloadPDF = async () => {
    if (!licitacion.plano_url) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'landscape' })
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = licitacion.plano_url
      img.onload = () => {
        const w = doc.internal.pageSize.getWidth()
        const h = (img.height * w) / img.width
        doc.addImage(img, 'JPEG', 0, 10, w, Math.min(h, doc.internal.pageSize.getHeight() - 20))
        doc.save(`plano-${licitacion.titulo}.pdf`)
      }
    } catch {
      window.open(licitacion.plano_url, '_blank')
    }
  }

  return (
    <div className="bg-[var(--card)] rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-xl text-slate-800 leading-tight">{licitacion.titulo}</h2>
          {licitacion.descripcion && (
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{licitacion.descripcion}</p>
          )}
        </div>
        <Badge variant={ESTADO_BADGE[licitacion.estado] ?? 'neutral'}>
          {ESTADO_LABEL[licitacion.estado] ?? licitacion.estado}
        </Badge>
      </div>

      {licitacion.estado === 'abierta' && licitacion.vence_en && (
        <Countdown venceEn={licitacion.vence_en} />
      )}

      {tipoInfo && (
        <div className="flex items-center gap-2 bg-[var(--surface)] border border-sky-100 rounded-xl px-3 py-2.5">
          <span className="text-lg">{tipoInfo.emoji}</span>
          <div>
            <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-wide">Servicio requerido</p>
            <p className="text-sm font-semibold text-slate-800">{tipoInfo.label}</p>
          </div>
        </div>
      )}

      {licitacion.plano_url && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <FileText size={13} /> Plano adjunto
            </p>
            <div className="flex items-center gap-3">
              <a
                href={licitacion.plano_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--primary)] font-semibold hover:underline"
              >
                Ver completo ↗
              </a>
              <button
                onClick={handleDownloadPDF}
                className="text-xs text-slate-600 font-semibold hover:text-[var(--primary)] flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1 hover:border-[var(--primary)] transition-colors"
              >
                <Download size={12} /> Descargar PDF
              </button>
            </div>
          </div>
          <a href={licitacion.plano_url} target="_blank" rel="noopener noreferrer">
            <img
              src={licitacion.plano_url}
              alt="Plano de obra"
              className="w-full max-h-64 object-contain rounded-xl bg-slate-50 border border-slate-100 cursor-zoom-in hover:opacity-90 transition-opacity"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </a>
        </div>
      )}
    </div>
  )
}
