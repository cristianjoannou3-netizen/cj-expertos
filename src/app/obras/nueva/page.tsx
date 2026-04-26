'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import SubirFoto from '@/components/obras/SubirFoto'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

// ── Tipos ──────────────────────────────────────────────────────
interface FormData {
  // Step 1
  titulo: string
  descripcion: string
  tipo_abertura: string
  cliente_nombre: string
  cliente_telefono: string
  cliente_ubicacion: string
  // Step 2
  monto_presupuestado: string
  monto_acopiado: string
  costo_aluminio: string
  costo_vidrio: string
  costo_accesorios: string
  // Step 3
  ancho_mm: string
  alto_mm: string
  foto_url: string
}

const INITIAL: FormData = {
  titulo: '', descripcion: '', tipo_abertura: '', cliente_nombre: '',
  cliente_telefono: '', cliente_ubicacion: '',
  monto_presupuestado: '', monto_acopiado: '', costo_aluminio: '',
  costo_vidrio: '', costo_accesorios: '',
  ancho_mm: '', alto_mm: '', foto_url: '',
}

const TIPOLOGIAS_OPTIONS = [
  { value: '', label: 'Seleccionar tipo...' },
  { value: 'VC',  label: 'Ventana Corrediza 2 hojas' },
  { value: 'VC3', label: 'Ventana Corrediza 3 hojas' },
  { value: 'VC4', label: 'Ventana Corrediza 4 hojas' },
  { value: 'PC',  label: 'Puerta Corrediza 2 hojas' },
  { value: 'PC4', label: 'Puerta Corrediza 4 hojas' },
  { value: 'VAR', label: 'Ventana de Abrir borde Recto' },
  { value: 'VAC', label: 'Ventana de Abrir borde Curvo' },
  { value: 'PR',  label: 'Puerta de Rebatir 1 hoja' },
  { value: 'PR2', label: 'Puerta de Rebatir 2 hojas' },
  { value: 'PF',  label: 'Paño Fijo' },
  { value: 'otro', label: 'Otro' },
]

const STEPS = ['Datos básicos', 'Presupuesto', 'Foto y medidas']

// ── Helpers ────────────────────────────────────────────────────
const numOrNull = (v: string) => { const n = parseFloat(v); return !isNaN(n) && n >= 0 ? n : null }
const intOrNull = (v: string) => { const n = parseInt(v); return !isNaN(n) && n > 0 ? n : null }

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={[
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
            i < current ? 'bg-[var(--primary)] text-white' :
            i === current ? 'bg-[var(--accent)] text-white' :
            'bg-slate-200 text-slate-500',
          ].join(' ')}>
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          <span className={`text-xs font-semibold hidden sm:block ${i === current ? 'text-[var(--accent)]' : 'text-slate-400'}`}>
            {STEPS[i]}
          </span>
          {i < total - 1 && <div className={`h-0.5 w-6 ${i < current ? 'bg-[var(--primary)]' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function NuevaObraPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Cargar userId lazy (solo cuando foto se sube)
  const getUserId = useCallback(async () => {
    if (userId) return userId
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return null }
    setUserId(user.id)
    return user.id
  }, [userId, supabase, router])

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const positiveOnly = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v === '' || parseFloat(v) >= 0) setForm(f => ({ ...f, [k]: v }))
  }

  // Validar step actual antes de avanzar
  function validateStep(): boolean {
    setError('')
    if (step === 0 && !form.titulo.trim()) { setError('El título es obligatorio.'); return false }
    if (step === 2) {
      if (form.ancho_mm && (isNaN(parseInt(form.ancho_mm)) || parseInt(form.ancho_mm) <= 0)) { setError('Ancho inválido.'); return false }
      if (form.alto_mm  && (isNaN(parseInt(form.alto_mm))  || parseInt(form.alto_mm)  <= 0)) { setError('Alto inválido.');  return false }
    }
    return true
  }

  function next() { if (validateStep()) setStep(s => s + 1) }
  function back() { setError(''); setStep(s => s - 1) }

  async function guardar() {
    if (!validateStep()) return
    setSaving(true)
    setError('')
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) throw new Error('Sesión expirada.')

      const costos = (numOrNull(form.costo_aluminio) ?? 0) + (numOrNull(form.costo_vidrio) ?? 0) + (numOrNull(form.costo_accesorios) ?? 0)

      const { data, error: insertErr } = await supabase.from('obras').insert({
        carpintero_id:       user.id,
        titulo:              form.titulo.trim(),
        descripcion:         form.descripcion.trim() || null,
        tipo_abertura:       form.tipo_abertura || null,
        cliente_nombre:      form.cliente_nombre.trim() || null,
        cliente_telefono:    form.cliente_telefono.trim() || null,
        cliente_ubicacion:   form.cliente_ubicacion.trim() || null,
        monto_presupuestado: numOrNull(form.monto_presupuestado),
        monto_acopiado:      numOrNull(form.monto_acopiado),
        costo_aluminio:      numOrNull(form.costo_aluminio),
        costo_vidrio:        numOrNull(form.costo_vidrio),
        costo_accesorios:    numOrNull(form.costo_accesorios),
        costo_total:         costos > 0 ? costos : null,
        ancho_mm:            intOrNull(form.ancho_mm),
        alto_mm:             intOrNull(form.alto_mm),
        foto_url:            form.foto_url || null,
        estado:              'presupuesto',
      }).select().single()

      if (insertErr) throw new Error(`Error al crear obra: ${insertErr.message}`)
      router.push(`/obras/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.')
    } finally {
      setSaving(false)
    }
  }

  const costos = (parseFloat(form.costo_aluminio) || 0) + (parseFloat(form.costo_vidrio) || 0) + (parseFloat(form.costo_accesorios) || 0)
  const acopio = parseFloat(form.monto_acopiado) || 0
  const sobrante = acopio - costos

  return (
    <AppShell perfil={null} pageTitle="Nueva Obra">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-slate-800 mb-1">Nueva Obra</h1>
        <p className="text-slate-500 text-sm mb-5">Completa los datos en 3 pasos</p>

        <StepIndicator current={step} total={STEPS.length} />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* STEP 0 — Datos básicos */}
        {step === 0 && (
          <Card header="Datos básicos">
            <div className="space-y-4">
              <Input label="Título *" placeholder="Ej: Ventanas depto López" value={form.titulo} onChange={set('titulo')} maxLength={120} />
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Descripción</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                  rows={3} maxLength={500} placeholder="Detalles, tipología, observaciones..."
                  value={form.descripcion} onChange={set('descripcion')}
                />
              </div>
              <Select
                label="Tipo de abertura"
                options={TIPOLOGIAS_OPTIONS}
                value={form.tipo_abertura}
                onChange={set('tipo_abertura')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Nombre del cliente" placeholder="Ana García" value={form.cliente_nombre} onChange={set('cliente_nombre')} maxLength={100} />
                <Input label="Teléfono" type="tel" placeholder="341 555-0000" value={form.cliente_telefono} onChange={set('cliente_telefono')} maxLength={30} />
              </div>
              <Input label="Dirección / Ubicación" placeholder="Rosario, Santa Fe" value={form.cliente_ubicacion} onChange={set('cliente_ubicacion')} maxLength={150} />
            </div>
          </Card>
        )}

        {/* STEP 1 — Materiales y presupuesto */}
        {step === 1 && (
          <Card header="Presupuesto y materiales">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Monto presupuestado ($)" type="number" inputMode="decimal" min={0} placeholder="0" value={form.monto_presupuestado} onChange={positiveOnly('monto_presupuestado')} />
                <Input label="Acopio cobrado ($)" type="number" inputMode="decimal" min={0} placeholder="0" value={form.monto_acopiado} onChange={positiveOnly('monto_acopiado')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Costo aluminio ($)" type="number" inputMode="decimal" min={0} placeholder="0" value={form.costo_aluminio} onChange={positiveOnly('costo_aluminio')} />
                <Input label="Costo vidrio ($)" type="number" inputMode="decimal" min={0} placeholder="0" value={form.costo_vidrio} onChange={positiveOnly('costo_vidrio')} />
                <Input label="Accesorios ($)" type="number" inputMode="decimal" min={0} placeholder="0" value={form.costo_accesorios} onChange={positiveOnly('costo_accesorios')} />
              </div>
              {acopio > 0 && costos > 0 && (
                <div className={`rounded-xl p-4 border-2 ${sobrante >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Acopio</span>
                    <span className="font-bold">${acopio.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Costos materiales</span>
                    <span className="font-bold">${costos.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between">
                    <span className="font-black text-slate-800">{sobrante >= 0 ? 'Sobrante' : 'Déficit'}</span>
                    <span className={`text-xl font-black ${sobrante >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(sobrante).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* STEP 2 — Foto + medidas */}
        {step === 2 && (
          <div className="space-y-4">
            <Card header="Foto del vano">
              <SubirFoto
                prefix={userId ?? 'tmp'}
                currentUrl={form.foto_url || null}
                onUpload={async (url) => {
                  await getUserId()
                  setForm(f => ({ ...f, foto_url: url }))
                }}
              />
            </Card>
            <Card header="Medidas del vano">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ancho (mm)" type="number" inputMode="numeric" min={1} max={9999} placeholder="1500"
                  value={form.ancho_mm} onChange={positiveOnly('ancho_mm')}
                  className="text-2xl font-black text-center py-5"
                />
                <Input
                  label="Alto (mm)" type="number" inputMode="numeric" min={1} max={9999} placeholder="1200"
                  value={form.alto_mm} onChange={positiveOnly('alto_mm')}
                  className="text-2xl font-black text-center py-5"
                />
              </div>
              {form.ancho_mm && form.alto_mm && !isNaN(parseInt(form.ancho_mm)) && !isNaN(parseInt(form.alto_mm)) && (
                <p className="text-center text-sm text-slate-500 mt-3">
                  Superficie: <strong>{((parseInt(form.ancho_mm) * parseInt(form.alto_mm)) / 1e6).toFixed(2)} m²</strong>
                </p>
              )}
            </Card>
          </div>
        )}

        {/* Navegación */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <Button variant="outline" onClick={back} disabled={saving}>
              <ChevronLeft size={16} /> Anterior
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button className="flex-1" onClick={next}>
              Siguiente <ChevronRight size={16} />
            </Button>
          ) : (
            <Button className="flex-1" loading={saving} onClick={guardar}>
              {saving ? 'Guardando...' : 'Crear obra'}
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
