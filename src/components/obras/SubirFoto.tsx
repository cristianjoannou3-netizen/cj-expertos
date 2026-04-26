'use client'
import { useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface SubirFotoProps {
  /** Path prefix in bucket, e.g. the user ID */
  prefix: string
  onUpload: (url: string) => void
  /** Optional existing URL to show */
  currentUrl?: string | null
  label?: string
  accept?: string
}

const BUCKET = 'fotos-obra'
const MAX_BYTES = 10 * 1024 * 1024
const MAX_PX = 1200

/** Compress image via canvas — returns a Blob (never base64) */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round((height * MAX_PX) / width); width = MAX_PX }
        else { width = Math.round((width * MAX_PX) / height); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas context unavailable')); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('canvas.toBlob failed'))
      }, 'image/webp', 0.85)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function SubirFoto({ prefix, onUpload, currentUrl, label = 'Foto del vano', accept = 'image/jpeg,image/png,image/webp' }: SubirFotoProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes.'); return }
    if (file.size > MAX_BYTES) { setError('La foto no puede superar 10 MB.'); return }
    setError(null)

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)
    try {
      const blob = await compressImage(file)
      const filePath = `${prefix}/${Date.now()}.webp`
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, blob, { contentType: 'image/webp', upsert: false })
      if (uploadErr) throw new Error(`Error al subir: ${uploadErr.message}`)
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
      onUpload(data.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la foto.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }, [prefix, onUpload, supabase])

  const displayUrl = preview ?? currentUrl

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">{label}</p>

      {displayUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt="Foto obra" className="w-full h-52 object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-semibold text-sm animate-pulse">Subiendo...</span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Button size="sm" variant="outline" className="bg-white" onClick={() => inputRef.current?.click()} disabled={uploading}>
              Cambiar foto
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-[var(--accent)] transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <p className="text-slate-500 font-semibold animate-pulse">Comprimiendo y subiendo...</p>
          ) : (
            <>
              <p className="text-3xl mb-2">📷</p>
              <p className="font-semibold text-slate-600">Tomar foto o elegir archivo</p>
              <p className="text-xs text-slate-400 mt-1">JPG · PNG · WebP — máx. 10 MB (se comprime a 1200px)</p>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  )
}
