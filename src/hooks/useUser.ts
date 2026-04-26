'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Keep a stable ref to the supabase client (singleton is fine, we always call getUser() fresh)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error: profileError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      setError(profileError.message)
      setProfile(null)
    } else {
      setProfile(data as Perfil)
    }
  }, [supabase])

  // Re-verify session on every pathname change (catches browser back/forward)
  useEffect(() => {
    let mounted = true
    setLoading(true)

    async function init() {
      // Always call getUser() — never rely on cached session state
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

      if (!mounted) return

      if (userError || !currentUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setUser(currentUser)
      await fetchProfile(currentUser.id)
      if (mounted) setLoading(false)
    }

    init()

    return () => { mounted = false }
  // pathname as dep ensures we re-check session when route changes (back/forward navigation)
  }, [pathname, supabase, fetchProfile])

  // Auth state change listener (handles login/logout events from other tabs or code)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session.user)
        await fetchProfile(session.user.id)
        setLoading(false)
      }
    })

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
