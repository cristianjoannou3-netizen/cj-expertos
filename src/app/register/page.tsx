'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Rol } from '@/types/perfil'

type RegisterRol = Exclude<Rol, 'admin'>

interface RolCard {
  value: RegisterRol
  label: string
  description: string
  icon: React.ReactNode
}

const ROL_CARDS: RolCard[] = [
  {
    value: 'carpintero',
    label: 'Carpintero',
    description: 'Ofrezco servicios de aluminio',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    value: 'cliente',
    label: 'Cliente',
    description: 'Busco un carpintero',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
      </svg>
    ),
  },
  {
    value: 'proveedor',
    label: 'Proveedor',
    description: 'Vendo materiales',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
]

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2>(1)

  // Paso 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Paso 2
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<RegisterRol>('cliente')
  const [ciudad, setCiudad] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) { setError('El email es obligatorio.'); return }
    if (!validateEmail(email)) { setError('El email no tiene un formato válido.'); return }
    if (!password) { setError('La contraseña es obligatoria.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }
    setStep(2)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) { setError('El nombre completo es obligatorio.'); return }

    setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre: nombre.trim(), rol },
      },
    })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    if (data.user && !data.session) {
      setEmailSent(true)
      return
    }

    if (data.session) {
      fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'bienvenida',
          datos: { email, nombre: nombre.trim() },
        }),
      }).catch(() => null)
      router.push('/dashboard')
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary)] rounded-2xl mb-4 shadow-lg">
              <span className="text-white font-black text-2xl">CJ</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Revisá tu email</h2>
            <p className="text-slate-500 text-sm mb-1">
              Te enviamos un link de confirmación a:
            </p>
            <p className="font-semibold text-slate-800 mb-4">{email}</p>
            <p className="text-slate-500 text-sm mb-6">
              Hacé clic en el link para activar tu cuenta y empezar a usar CJ Expertos.
            </p>
            <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline text-sm">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary)] rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-black text-2xl">CJ</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">CJ Expertos</h1>
          <p className="text-blue-300 mt-1 text-sm">Creá tu cuenta gratuita</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step >= 1 ? 'bg-[var(--primary)] text-white' : 'bg-white/20 text-white/60'
            }`}>1</div>
            <span className="text-xs text-white/70 font-medium">Cuenta</span>
          </div>
          <div className="w-8 h-px bg-white/30" />
          <div className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step >= 2 ? 'bg-[var(--primary)] text-white' : 'bg-white/20 text-white/60'
            }`}>2</div>
            <span className="text-xs text-white/70 font-medium">Perfil</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-6">Creá tu acceso</h2>
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 bg-slate-50"
                    placeholder="tu@email.com" autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña * <span className="font-normal text-slate-400">(mín. 8 caracteres)</span></label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 bg-slate-50"
                    placeholder="••••••••" autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar contraseña *</label>
                  <input
                    type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 bg-slate-50"
                    placeholder="••••••••" autoComplete="new-password"
                  />
                </div>
                <button type="submit"
                  className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-mid)] text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                  Continuar
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => { setStep(1); setError('') }}
                  className="text-slate-400 hover:text-slate-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold text-slate-800">Tu perfil</h2>
              </div>
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre completo *</label>
                  <input
                    type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 bg-slate-50"
                    placeholder="Juan García" autoComplete="name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Soy...</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROL_CARDS.map(card => (
                      <button
                        key={card.value}
                        type="button"
                        onClick={() => setRol(card.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${
                          rol === card.value
                            ? 'border-[var(--primary)] bg-[var(--surface)] text-[var(--primary)]'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span className={rol === card.value ? 'text-[var(--primary)]' : 'text-slate-400'}>
                          {card.icon}
                        </span>
                        <span className="text-xs font-bold leading-tight">{card.label}</span>
                        <span className="text-[10px] leading-tight opacity-80">{card.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ciudad</label>
                  <input
                    type="text" value={ciudad} onChange={e => setCiudad(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 bg-slate-50"
                    placeholder="Buenos Aires"
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-mid)] disabled:opacity-60 text-white font-bold rounded-xl transition-colors shadow-sm">
                  {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
