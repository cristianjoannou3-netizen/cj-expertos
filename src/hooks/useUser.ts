'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types/perfil'
 
interface UseUserReturn {
  user: User | null
  profile: Perfil | null
  loading: boolean
  error: string | null
  logout: () => Promise<void>
}
 
export function useUser(): UseUserReturn {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const initializedRef = useRef(false)
 
  const fetchProfile = useCallback(async (userId: string): Promise<Perfil | null> => {
    const { data, error: profileError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (profileError) {
      setError(profileError.message)
      return null
    }
    return data as Perfil
  }, [supabase])
 
  useEffect(() => {
    // Usamos onAuthStateChange como ÚNICA fuente de verdad.
    // getSession() inicial se maneja dentro del listener con INITIAL_SESSION.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          // Primera carga: sesión inicial
          if (!session?.user) {
            setUser(null)
            setProfile(null)
            setLoading(false)
            return
          }
          setUser(session.user)
          const perfil = await fetchProfile(session.user.id)
          setProfile(perfil)
          setLoading(false)
          return
        }
 
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
 
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (!session?.user) return
          setUser(session.user)
          const perfil = await fetchProfile(session.user.id)
          setProfile(perfil)
          setLoading(false)
          return
        }
      }
    )
 
    return () => { subscription.unsubscribe() }
  }, [supabase, fetchProfile])
 
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/login')
  }, [supabase, router])
 
  return { user, profile, loading, error, logout }
}
