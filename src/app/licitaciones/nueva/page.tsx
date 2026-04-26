'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, Users, ArrowLeft, ArrowRight, Factory, Truck, Wrench } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types/perfil'

const STEPS = ['Datos de la obra', 'Plano', 'Carpinteros', 'Confirmar']

const TIPO_SERVICIO = [
  { value: 'solo_fabricacion', label: 'Solo fabricación', desc: 'Yo retiro y coloco', Icon: Factory },
  { value: 'entrega', label: 'Con entrega', desc: 'Entrega a domicilio, yo coloco', Icon: Truck },
  { value: 'colocacion', label: 'Entrega + colocación', desc: 'Fabricación, entrega e instalación', Icon: Wrench },
]

interface FormData {
  titulo: string
  descripcion: string
  tipoServicio: string
  planoUrl: string
  planoNombre: string
  carpinterosSeleccionados: string[]
}

export default function NuevaLicitacionPage() {
  const { profile, loading } = useUser()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>({
    titulo: '',
    descripcion: '',
    tipoServicio: 'colocacion',
    planoUrl: '',
    planoNombre: '',
    carpinterosSeleccionados: [],
  })
  const [carpinteros, setCarpinteros] = useState<Perfil[]>([])
  const [loadingCarpinteros, setLoadingCarpinteros] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')
  const [licitacionCreada, setLicitacionCreada] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const canNext = [
    () => form.titulo.trim().length >= 3,
    () => Boolean(form.planoUrl),
    () => form.carpinterosSeleccionados.length >= 1,
    () => true,
  ]

  const loadCarpinteros = async () => {
    if (carpinteros.length > 0) return
    setLoadingCarpinteros(true)
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'carpintero')
      .eq('activo', true)
      .order('nombre')
    setCarpinteros((data ?? []) as Perfil[])
    setLoadingCarpinteros(false)
  }

  const handleNext = () => {
    if (step === 2) loadCarpinteros()
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  const handleBack = () => setStep(s => s - 1)

  const handlePlano = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    try {
      // Para imágenes: resize con canvas
      let uploadFile: File | Blob = file
      if (file.type.startsWith('image/')) {
        uploadFile = await resizeImagen(file)
      }

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${profile?.id ?? 'anon'}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('planos-licitacion')
        .upload(path, uploadFile, { contentType: file.type })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('planos-licitacion')
        .getPublicUrl(path)

      setForm(f => ({ ...f, planoUrl: publicUrl, planoNombre: file.name }))
    } catch (err) {
      setError((err as Error).message)
    }
    setUploading(false)
  }

  const resizeImagen = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const max = 800
        const ratio = Math.min(max / img.width, max / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Error al redimensionar')), 'image/jpeg', 0.7)
      }
      img.onerror = () => reject(new Error('Imagen inválida'))
      img.src = url
    })

  const toggleCarpintero = (id: string) => {
    setForm(f => ({
      ...f,
      carpinterosSeleccionados: f.carpinterosSeleccionados.includes(id)
        ? f.carpinterosSeleccionados.filter(x => x !== id)
        : [...f.carpinterosSeleccionados, id],
    }))
  }

  const handleCrear = async () => {
    if (!profile) return
    setCreando(true)
    setError('')

    const venceEn = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const { data: lic, error: licErr } = await supabase
      .from('licitaciones')
      .insert({
        cliente_id: profile.id,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        tipo_servicio: form.tipoServicio,
        plano_url: form.planoUrl || null,
        estado: 'abierta',
        vence_en: venceEn,
      })
      .select()
      .single()

    if (licErr || !lic) {
      setError(licErr?.message ?? 'Error al crear licitación')
      setCreando(false)
      return
    }

    // Notificar a los carpinteros invitados
    if (form.carpinterosSeleccionados.length > 0) {
      await supabase.from('notificaciones').insert(
        form.carpinterosSeleccionados.map(carpId => ({
          usuario_id: carpId,
          tipo: 'cotizacion',
          titulo: 'Nueva licitación disponible',
          mensaje: `Te invitaron a cotizar: "${form.titulo.trim()}". Tenés 48 horas.`,
          link: `/licitaciones/${lic.id}`,
        }))
      )
    }

    setLicitacionCreada(lic.id)
    setCreando(false)
  }

  // While loading: show a neutral spinner without any page title that could confuse
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Non-client users must not access this page — redirect immediately
  if (!profile || profile.rol !== 'cliente') {
    router.replace('/licitaciones')
    return null
  }

  if (licitacionCreada) {
    return (
      <AppShell perfil={profile} pageTitle="Nueva Licitación">
        <div className="max-w-lg mx-auto">
          <Card>
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={36} className="text-[var(--success)]" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">¡Licitación publicada!</h2>
              <p className="text-slate-500 text-sm">
                Se invitó a <strong>{form.carpinterosSeleccionados.length} carpintero(s)</strong>.
                Tienen <strong>48 horas</strong> para enviar su cotización.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Button onClick={() => router.push(`/licitaciones/${licitacionCreada}`)}>
                  Ver licitación
                </Button>
                <Button variant="outline" onClick={() => router.push('/licitaciones')}>
                  Mis licitaciones
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell perfil={profile} pageTitle="Nueva Licitación">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress steps */}
        <div className="flex items-center gap-0">
          {STEPS.map((label, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  idx < step ? 'bg-[var(--success)] text-white' :
                  idx === step ? 'bg-[var(--primary)] text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {idx < step ? <CheckCircle size={14} /> : idx + 1}
                </div>
                <span className={`text-xs mt-1 font-medium hidden sm:block ${
                  idx === step ? 'text-[var(--primary)]' : 'text-slate-400'
                }`}>{label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${idx < step ? 'bg-[var(--success)]' : 'bg-slate-100'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-[var(--danger)] bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Step 0: Datos */}
        {step === 0 && (
          <Card>
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-5">
              Datos de la obra
            </h2>
            <div className="space-y-4">
              <Input
                label="Título *"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej: Ventanas edificio 3er piso — 12 unidades"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Descripción / especificaciones
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  rows={4}
                  className="w-full bg-[var(--surface)] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none transition-all"
                  placeholder="Tipo de aberturas, materiales, plazos, condiciones especiales..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Tipo de servicio *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TIPO_SERVICIO.map(op => (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipoServicio: op.value }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.tipoServicio === op.value
                          ? 'border-[var(--primary)] bg-[var(--surface)]'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <op.Icon size={18} className={form.tipoServicio === op.value ? 'text-[var(--primary)] mb-2' : 'text-slate-300 mb-2'} />
                      <p className="text-sm font-bold text-slate-800">{op.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{op.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 1: Plano */}
        {step === 1 && (
          <Card>
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-5">
              Plano de la obra
            </h2>
            {form.planoUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle size={18} className="text-[var(--success)] shrink-0" />
                  <span className="text-sm text-green-700 font-medium flex-1 truncate">{form.planoNombre}</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, planoUrl: '', planoNombre: '' }))}
                    className="text-xs text-slate-400 hover:text-[var(--danger)] font-medium transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
                <img
                  src={form.planoUrl}
                  alt="Plano"
                  className="w-full max-h-64 object-contain rounded-xl bg-slate-50 border border-slate-100"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-40 border-2 border-dashed border-[var(--primary)]/40 rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-semibold">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload size={24} />
                    <span className="text-sm font-semibold">Subir plano</span>
                    <span className="text-xs text-slate-400">JPG, PNG o PDF — máx. 5MB</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handlePlano}
              className="hidden"
            />
          </Card>
        )}

        {/* Step 2: Carpinteros */}
        {step === 2 && (
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                <Users size={15} /> Invitar carpinteros
              </h2>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                form.carpinterosSeleccionados.length >= 1
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {form.carpinterosSeleccionados.length} seleccionado(s)
              </span>
            </div>

            {loadingCarpinteros ? (
              <p className="text-slate-400 text-sm text-center py-8">Cargando carpinteros...</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {carpinteros.map(c => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      form.carpinterosSeleccionados.includes(c.id)
                        ? 'border-[var(--primary)] bg-[var(--surface)]'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.carpinterosSeleccionados.includes(c.id)}
                      onChange={() => toggleCarpintero(c.id)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-bold text-sm shrink-0">
                      {c.nombre.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.nombre}</p>
                        {c.verificado && (
                          <span className="text-xs text-[var(--primary)] bg-[var(--surface)] border border-sky-100 px-1.5 rounded-full shrink-0">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {c.ciudad && `${c.ciudad} · `}
                        {c.m2_taller && `${c.m2_taller}m² · `}
                        {c.experiencia && `${c.experiencia} años exp.`}
                      </p>
                    </div>
                  </label>
                ))}
                {carpinteros.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-8">No hay carpinteros activos disponibles</p>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Step 3: Confirmar */}
        {step === 3 && (
          <Card>
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-5">
              Confirmar licitación
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Título</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%]">{form.titulo}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Tipo de servicio</span>
                <span className="font-semibold text-slate-800">
                  {TIPO_SERVICIO.find(t => t.value === form.tipoServicio)?.label}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Plano</span>
                <span className="font-semibold text-[var(--success)] flex items-center gap-1">
                  <CheckCircle size={13} /> {form.planoNombre || 'Adjunto'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-500">Carpinteros invitados</span>
                <span className="font-semibold text-slate-800">{form.carpinterosSeleccionados.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vencimiento</span>
                <span className="font-semibold text-slate-800">48 horas desde ahora</span>
              </div>
            </div>
          </Card>
        )}

        {/* Navegación */}
        <div className="flex justify-between items-center">
          {step > 0 ? (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft size={15} /> Anterior
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canNext[step]()}>
              Siguiente <ArrowRight size={15} />
            </Button>
          ) : (
            <Button onClick={handleCrear} loading={creando}>
              Publicar licitación
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
