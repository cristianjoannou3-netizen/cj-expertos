'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function getErrorMessage(code: string | undefined, message: string): string {
  if (!code) {
    if (message.toLowerCase().includes('invalid')) return 'Email o contraseña incorrectos.'
    if (message.toLowerCase().includes('confirm')) return 'Confirmá tu email antes de ingresar. Revisá tu casilla.'
    return message || 'Ocurrió un error. Intentá de nuevo.'
  }
  switch (code) {
    case 'invalid_credentials':
      return 'Email o contraseña incorrectos.'
    case 'email_not_confirmed':
      return 'Confirmá tu email antes de ingresar. Revisá tu casilla.'
    case 'user_not_found':
      return 'No existe una cuenta con ese email.'
    case 'too_many_requests':
      return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.'
    default:
      return message || 'Ocurrió un error. Intentá de nuevo.'
  }
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Completá todos los campos.')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(getErrorMessage((err as { code?: string }).code, err.message))
      return
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary)] rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-black text-2xl">CJ</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">CJ Expertos</h1>
          <p className="text-blue-300 mt-1 text-sm">Plataforma de carpintería de aluminio</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Iniciar sesión</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 bg-slate-50"
                placeholder="tu@email.com" autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-slate-700">Contraseña</label>
                <Link href="/forgot-password" className="text-xs text-[var(--accent)] hover:underline font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 bg-slate-50"
                placeholder="••••••••" autoComplete="current-password"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-mid)] disabled:opacity-60 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              {loading ? 'Entrando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">Registrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
