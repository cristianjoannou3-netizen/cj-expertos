'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Camera, Save } from 'lucide-react'
import type { Perfil } from '@/types/perfil'

const BUCKET = 'avatares'
const MAX_BYTES = 5 * 1024 * 1024
const MAX_PX = 400

async function compressAvatar(file: File): Promise<Blob> {
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
      if (!ctx) { reject(new Error('Canvas unavailable')); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('toBlob failed'))
      }, 'image/webp', 0.88)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

interface Props {
  perfil: Perfil | null
  userId: string
}

export default function EditarPerfilForm({ perfil, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [nombre, setNombre] = useState(perfil?.nombre || '')
  const [empresa, setEmpresa] = useState(perfil?.empresa || '')
  const [telefono, setTelefono] = useState(perfil?.telefono || '')
  const [ciudad, setCiudad] = useState(perfil?.ciudad || '')
  const [provincia, setProvincia] = useState(perfil?.provincia || '')
  const [bio, setBio] = useState(perfil?.bio || '')
  // Campos carpintero
  const [m2Taller, setM2Taller] = useState(String(perfil?.m2_taller ?? ''))
  const [empleados, setEmpleados] = useState(String(perfil?.empleados ?? ''))
  const [experiencia, setExperiencia] = useState(String(perfil?.experiencia ?? ''))
  // Datos bancarios carpintero
  const [cbu, setCbu] = useState(perfil?.cbu || '')
  const [aliasBancario, setAliasBancario] = useState(perfil?.alias_bancario || '')
  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(perfil?.avatar_url ?? null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(perfil?.avatar_url ?? null)

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const isCarpintero = perfil?.rol === 'carpintero'

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo imágenes.'); return }
    if (file.size > MAX_BYTES) { setError('Máx 5 MB.'); return }
    setError('')
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    try {
      const blob = await compressAvatar(file)
      const path = `${userId}/avatar.webp`
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/webp', upsert: true })
      if (upErr) throw new Error(upErr.message)
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir avatar.')
      setAvatarPreview(avatarUrl)
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMsg(''); setError('')
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setLoading(true)
    const updates: Record<string, unknown> = {
      id: userId,
      nombre: nombre.trim(),
      empresa: empresa || null,
      telefono: telefono || null,
      ciudad: ciudad || null,
      provincia: provincia || null,
      bio: bio || null,
    }
    if (avatarUrl) updates.avatar_url = avatarUrl
    if (isCarpintero) {
      if (m2Taller) updates.m2_taller = Number(m2Taller)
      if (empleados) updates.empleados = Number(empleados)
      if (experiencia) updates.experiencia = Number(experiencia)
      updates.cbu = cbu || null
      updates.alias_bancario = aliasBancario || null
    }
    const { error: err } = await supabase.from('perfiles').upsert(updates)
    setLoading(false)
    if (err) { setError(err.message); return }
    setMsg('Perfil actualizado correctamente.')
    router.refresh()
  }

  const inicial = (perfil?.nombre || '?')[0].toUpperCase()

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      <h2 className="font-bold text-slate-700 text-lg">Editar perfil</h2>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {msg && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{msg}</div>}

      {/* Avatar upload */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border border-slate-200" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[var(--surface)] flex items-center justify-center">
              <span className="text-3xl font-black text-[var(--primary)]">{inicial}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow hover:opacity-90 disabled:opacity-50"
            title="Cambiar foto"
          >
            {uploadingAvatar ? (
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera size={13} />
            )}
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Foto de perfil</p>
          <p className="text-xs text-slate-400 mt-0.5">JPG, PNG o WebP · máx. 5 MB</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      </div>

      {/* Datos personales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: 'Nombre *', value: nombre, set: setNombre, placeholder: 'Juan García' },
          ...(isCarpintero ? [{ label: 'Taller / Empresa', value: empresa, set: setEmpresa, placeholder: 'García Aberturas' }] : []),
          { label: 'Teléfono', value: telefono, set: setTelefono, placeholder: '341 555-0000' },
          { label: 'Ciudad', value: ciudad, set: setCiudad, placeholder: 'Rosario' },
          { label: 'Provincia', value: provincia, set: setProvincia, placeholder: 'Santa Fe' },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{f.label}</label>
            <input
              type="text" value={f.value} onChange={e => f.set(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800"
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>

      {/* Bio — solo carpinteros */}
      {isCarpintero && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Biografía</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 resize-none"
            placeholder="Contá tu experiencia, especialidades, zona de trabajo..."
            maxLength={500}
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/500</p>
        </div>
      )}

      {/* Campos exclusivos carpintero */}
      {isCarpintero && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Datos del taller</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'M² de taller', value: m2Taller, set: setM2Taller, placeholder: '80' },
              { label: 'Empleados', value: empleados, set: setEmpleados, placeholder: '3' },
              { label: 'Años de exp.', value: experiencia, set: setExperiencia, placeholder: '5' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{f.label}</label>
                <input
                  type="number" min="0" value={f.value} onChange={e => f.set(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800"
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>

          <p className="text-sm font-bold text-slate-600 uppercase tracking-wide pt-2">Datos bancarios</p>
          <p className="text-xs text-slate-400 -mt-2">
            Necesarios para que los clientes puedan transferirte directamente.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">CBU</label>
              <input
                type="text"
                value={cbu}
                onChange={e => setCbu(e.target.value.replace(/\D/g, '').slice(0, 22))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 font-mono"
                placeholder="0000000000000000000000"
                maxLength={22}
              />
              {cbu && cbu.length !== 22 && (
                <p className="text-xs text-amber-600 mt-1">El CBU debe tener exactamente 22 dígitos ({cbu.length}/22)</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Alias bancario</label>
              <input
                type="text"
                value={aliasBancario}
                onChange={e => setAliasBancario(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 font-mono"
                placeholder="MI.ALIAS.BANCARIO"
                maxLength={30}
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || uploadingAvatar}
        className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-mid)] disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Save size={16} />
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
