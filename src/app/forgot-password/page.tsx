'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) { setError('Ingresá tu email.'); return }

    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined,
    })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setSent(true)
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
          <p className="text-blue-300 mt-1 text-sm">Recuperá tu contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Email enviado</h2>
              <p className="text-slate-500 text-sm mb-1">
                Te enviamos un link para restablecer tu contraseña a:
              </p>
              <p className="font-semibold text-slate-800 mb-4">{email}</p>
              <p className="text-slate-500 text-sm mb-6">
                Revisá tu bandeja de entrada y seguí las instrucciones. El link expira en 1 hora.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-[var(--primary)] font-semibold hover:underline text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Recuperar contraseña</h2>
              <p className="text-slate-500 text-sm mb-6">
                Ingresá tu email y te enviamos un link para restablecer tu contraseña.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-slate-800 bg-slate-50"
                    placeholder="tu@email.com" autoComplete="email"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-mid)] disabled:opacity-60 text-white font-bold rounded-xl transition-colors shadow-sm">
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                <Link href="/login" className="text-[var(--primary)] font-semibold hover:underline">Volver al inicio de sesión</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
