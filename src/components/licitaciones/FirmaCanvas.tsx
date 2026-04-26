'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { Trash2, PenLine } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface Props {
  licitacionId: string
  firmanteId: string
  firmaGuardadaUrl?: string | null
  onConfirmar: (url: string) => void
}

const BUCKET = 'firmas'
const GUIA_Y_RATIO = 0.72   // línea guía al 72% del alto

function dibujarGuia(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const y = Math.round(canvas.height * GUIA_Y_RATIO)
  ctx.save()
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(20, y)
  ctx.lineTo(canvas.width - 20, y)
  ctx.stroke()
  ctx.restore()
}

export default function FirmaCanvas({ licitacionId, firmanteId, firmaGuardadaUrl, onConfirmar }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const hasTrazos = useRef(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [confirmado, setConfirmado] = useState(false)

  // Ajustar canvas al contenedor y dibujar guía
  useEffect(() => {
    if (firmaGuardadaUrl) return
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver(() => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      canvas.width = w
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, 200)
      }
      dibujarGuia(canvas)
    })
    resizeObserver.observe(canvas.parentElement!)
    return () => resizeObserver.disconnect()
  }, [firmaGuardadaUrl])

  const getPos = (e: MouseEvent | { clientX: number; clientY: number }, canvas: HTMLCanvasElement): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  // Handlers mouse
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    isDrawing.current = true
    hasTrazos.current = true
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e.nativeEvent, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e.nativeEvent, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }, [])

  const onMouseUp = useCallback(() => { isDrawing.current = false }, [])

  // Handlers touch
  const onTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    isDrawing.current = true
    hasTrazos.current = true
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const touch = e.touches[0]
    const pos = getPos(touch, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const touch = e.touches[0]
    const pos = getPos(touch, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    isDrawing.current = false
  }, [])

  const limpiar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    dibujarGuia(canvas)
    hasTrazos.current = false
    setConfirmado(false)
    setError('')
  }, [])

  const confirmar = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!hasTrazos.current) {
      setError('Dibujá tu firma antes de confirmar.')
      return
    }
    setError('')
    setUploading(true)

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('No se pudo generar la imagen de la firma.')
        setUploading(false)
        return
      }
      try {
        const supabase = createClient()
        const path = `${licitacionId}/${firmanteId}.png`
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: 'image/png', upsert: true })
        if (uploadErr) throw new Error(uploadErr.message)
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
        setConfirmado(true)
        onConfirmar(data.publicUrl)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar la firma.')
      } finally {
        setUploading(false)
      }
    }, 'image/png')
  }, [licitacionId, firmanteId, onConfirmar])

  // Si ya hay firma guardada, mostrar imagen
  if (firmaGuardadaUrl) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-600">Firma registrada</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={firmaGuardadaUrl}
          alt="Firma digital"
          className="border border-slate-200 rounded-xl bg-white max-h-24 object-contain"
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">Firma manuscrita</p>
      <p className="text-xs text-slate-400">Dibujá tu firma con el dedo o el mouse sobre el área blanca</p>

      <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 bg-white cursor-crosshair">
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '200px', touchAction: 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
        {confirmado && (
          <div className="absolute inset-0 bg-green-50/80 flex items-center justify-center pointer-events-none">
            <p className="text-sm font-bold text-green-700">Firma guardada</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={limpiar}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
        >
          <Trash2 size={13} /> Limpiar
        </button>
        <Button
          size="sm"
          onClick={confirmar}
          loading={uploading}
          disabled={confirmado}
          className="flex items-center gap-1.5"
        >
          <PenLine size={13} /> {confirmado ? 'Firma guardada' : 'Confirmar firma'}
        </Button>
      </div>
    </div>
  )
}
