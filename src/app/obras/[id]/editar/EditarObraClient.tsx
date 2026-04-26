'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function numOrNull(val: string) {
  const n = parseFloat(val)
  return !isNaN(n) && n > 0 ? n : null
}

function intOrNull(val: string) {
  const n = parseInt(val)
  return !isNaN(n) && n > 0 ? n : null
}

export default function EditarObraClient({ id }: { id: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [clienteUbicacion, setClienteUbicacion] = useState('')
  const [anchoMm, setAnchoMm] = useState('')
  const [altoMm, setAltoMm] = useState('')
  const [montoPresupuestado, setMontoPresupuestado] = useState('')
  const [montoAcopiado, setMontoAcopiado] = useState('')
  const [costoAluminio, setCostoAluminio] = useState('')
  const [costoVidrio, setCostoVidrio] = useState('')
  const [costoAccesorios, setCostoAccesorios] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoUrlActual, setFotoUrlActual] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    async function cargarObra() {
      const { data: obra, error: err } = await supabase
        .from('obras').select('*').eq('id', id).single()
      if (err || !obra) { setError('Obra no encontrada.'); setLoadingData(false); return }
      setTitulo(obra.titulo || '')
      setDescripcion(obra.descripcion || '')
      setClienteNombre(obra.cliente_nombre || '')
      setClienteTelefono(obra.cliente_telefono || '')
      setClienteUbicacion(obra.cliente_ubicacion || '')
      setAnchoMm(obra.ancho_mm ? String(obra.ancho_mm) : '')
      setAltoMm(obra.alto_mm ? String(obra.alto_mm) : '')
      setMontoPresupuestado(obra.monto_presupuestado ? String(obra.monto_presupuestado) : '')
      setMontoAcopiado(obra.monto_acopiado ? String(obra.monto_acopiado) : '')
      setCostoAluminio(obra.costo_aluminio ? String(obra.costo_aluminio) : '')
      setCostoVidrio(obra.costo_vidrio ? String(obra.costo_vidrio) : '')
      setCostoAccesorios(obra.costo_accesorios ? String(obra.costo_accesorios) : '')
      setFotoUrlActual(obra.foto_url || null)
      setLoadingData(false)
    }
    cargarObra()
  }, [id])

  const handleFoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes (jpg, png, webp).'); return }
    if (file.size > 10 * 1024 * 1024) { setError('La foto no puede superar 10 MB.'); return }
    if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
    setError('')
  }, [fotoPreview])

  function quitarFotoNueva() {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    setFoto(null)
    setFotoPreview(null)
  }

  function handlePositiveNumber(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (val === '' || parseFloat(val) >= 0) setter(val)
    }
  }

  const costos = (parseFloat(costoAluminio) || 0) + (parseFloat(costoVidrio) || 0) + (parseFloat(costoAccesorios) || 0)
  const acopio = parseFloat(montoAcopiado) || 0
  const puedeMostrarSobrante = acopio > 0 && costos > 0
  const sobrante = acopio - costos

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!titulo.trim()) { setError('El título de la obra es obligatorio.'); return }
    if (anchoMm && (isNaN(parseInt(anchoMm)) || parseInt(anchoMm) <= 0)) { setError('El ancho debe ser un número positivo en mm.'); return }
    if (altoMm && (isNaN(parseInt(altoMm)) || parseInt(altoMm) <= 0)) { setError('El alto debe ser un número positivo en mm.'); return }
    if (montoAcopiado && parseFloat(montoAcopiado) < 0) { setError('El acopio no puede ser negativo.'); return }

    setLoading(true)
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) throw new Error('Sesión expirada. Volvé a iniciar sesión.')

      let fotoUrl = fotoUrlActual
      if (foto) {
        const ext = foto.name.split('.').pop()?.toLowerCase() || 'jpg'
        const filePath = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('fotos-obra').upload(filePath, foto, { contentType: foto.type, upsert: false })
        if (uploadErr) throw new Error(`Error al subir la foto: ${uploadErr.message}`)
        const { data: urlData } = supabase.storage.from('fotos-obra').getPublicUrl(filePath)
        fotoUrl = urlData.publicUrl
      }

      const { error: updateErr } = await supabase.from('obras').update({
        titulo:              titulo.trim(),
        descripcion:         descripcion.trim() || null,
        cliente_nombre:      clienteNombre.trim() || null,
        cliente_telefono:    clienteTelefono.trim() || null,
        cliente_ubicacion:   clienteUbicacion.trim() || null,
        ancho_mm:            intOrNull(anchoMm),
        alto_mm:             intOrNull(altoMm),
        monto_presupuestado: numOrNull(montoPresupuestado),
        monto_acopiado:      numOrNull(montoAcopiado),
        costo_aluminio:      numOrNull(costoAluminio),
        costo_vidrio:        numOrNull(costoVidrio),
        costo_accesorios:    numOrNull(costoAccesorios),
        foto_url:            fotoUrl,
      }).eq('id', id).eq('carpintero_id', user.id)

      if (updateErr) throw new Error(`Error al guardar: ${updateErr.message}`)

      setSuccess('Obra actualizada correctamente.')
      setTimeout(() => router.push(`/obras/${id}`), 900)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 font-semibold">Cargando obra...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/obras/${id}`} className="text-sm font-semibold text-slate-500 hover:text-[var(--primary)]">← Volver</Link>
        <span className="text-slate-300">›</span>
        <span className="text-slate-700 font-bold">Editar obra</span>
      </div>

      <h1 className="text-2xl font-black text-slate-800">Editar obra</h1>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">

        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-700 text-lg">Información de la obra</h2>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Título *</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={120}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800"
              placeholder="Ej: Ventanas depto López" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} maxLength={500}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 resize-none"
              placeholder="Detalles, tipología, observaciones..." />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-700 text-lg">Datos del cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
              <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} maxLength={100}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Ana García" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
              <input type="tel" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} maxLength={30}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="341 555-0000" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Dirección / Ubicación</label>
            <input type="text" value={clienteUbicacion} onChange={e => setClienteUbicacion(e.target.value)} maxLength={150}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Rosario, Santa Fe" />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-700 text-lg">Medidas (mm)</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ancho (mm)</label>
              <input type="number" inputMode="numeric" value={anchoMm} onChange={handlePositiveNumber(setAnchoMm)} min={1} max={9999}
                className="w-full px-4 py-5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-2xl font-black text-center text-slate-800"
                placeholder="1500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Alto (mm)</label>
              <input type="number" inputMode="numeric" value={altoMm} onChange={handlePositiveNumber(setAltoMm)} min={1} max={9999}
                className="w-full px-4 py-5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-2xl font-black text-center text-slate-800"
                placeholder="1200" />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-700 text-lg">Presupuesto y costos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Monto presupuestado total ($)</label>
              <input type="number" inputMode="decimal" value={montoPresupuestado} onChange={handlePositiveNumber(setMontoPresupuestado)} min={0}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Acopio cobrado ($) <span className="text-orange-500 text-xs font-normal">— valor real</span>
              </label>
              <input type="number" inputMode="decimal" value={montoAcopiado} onChange={handlePositiveNumber(setMontoAcopiado)} min={0}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Costo aluminio ($)', val: costoAluminio, set: setCostoAluminio },
              { label: 'Costo vidrio ($)',   val: costoVidrio,   set: setCostoVidrio },
              { label: 'Accesorios ($)',     val: costoAccesorios, set: setCostoAccesorios },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{f.label}</label>
                <input type="number" inputMode="decimal" value={f.val} onChange={handlePositiveNumber(f.set)} min={0}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  placeholder="0" />
              </div>
            ))}
          </div>
          {puedeMostrarSobrante && (
            <div className={`rounded-xl p-4 border-2 ${sobrante >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Acopio cobrado</span>
                <span className="font-bold">${acopio.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-600">Costos materiales</span>
                <span className="font-bold">${costos.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="font-black text-slate-800">{sobrante >= 0 ? '✅ Sobrante estimado' : '⚠️ Déficit estimado'}</span>
                <span className={`text-2xl font-black ${sobrante >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(sobrante).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">El sobrante real se acredita al finalizar la obra.</p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-700 text-lg">Foto de la obra</h2>

          {fotoUrlActual && !fotoPreview && (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <img src={fotoUrlActual} alt="Foto actual" className="w-full h-48 object-cover" />
              <p className="text-xs text-slate-400 text-center py-2 bg-slate-50">Foto actual</p>
            </div>
          )}

          {fotoPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              <img src={fotoPreview} alt="Nueva foto" className="w-full h-48 object-cover" />
              <div className="absolute top-2 right-2 flex gap-2">
                <label className="cursor-pointer bg-black/60 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  Cambiar
                  <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handleFoto} className="hidden" />
                </label>
                <button type="button" onClick={quitarFotoNueva}
                  className="bg-red-600/80 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  Quitar
                </button>
              </div>
              <p className="text-xs text-center py-1.5 bg-[var(--surface)] text-[var(--primary)] font-semibold">Nueva foto (reemplazará la actual al guardar)</p>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handleFoto} className="hidden" />
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-[var(--accent)] transition-colors">
                <p className="text-4xl mb-2">📷</p>
                <p className="font-semibold text-slate-600">
                  {fotoUrlActual ? 'Subir nueva foto (reemplaza la actual)' : 'Agregar foto'}
                </p>
                <p className="text-sm text-slate-400 mt-1">JPG, PNG, WebP — máx. 10 MB</p>
              </div>
            </label>
          )}
        </section>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 py-4 bg-[var(--primary)] hover:bg-[var(--primary-mid)] active:opacity-90 disabled:opacity-60 text-white font-black text-lg rounded-2xl shadow-sm transition-colors">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href={`/obras/${id}`}
            className="px-6 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-colors text-center">
            Cancelar
          </Link>
        </div>

      </form>
    </div>
  )
}
