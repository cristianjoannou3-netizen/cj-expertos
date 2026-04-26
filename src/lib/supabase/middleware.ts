import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Rol } from '@/types/perfil'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password']

function getHomeByRol(rol: Rol): string {
  switch (rol) {
    case 'carpintero': return '/dashboard'
    case 'proveedor':  return '/dashboard'
    case 'admin':      return '/admin'
    case 'cliente':
    default:           return '/dashboard'
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Sin sesión en ruta protegida → login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión en ruta pública → redirigir al home del rol
  if (user && isPublic) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    url.pathname = perfil?.rol ? getHomeByRol(perfil.rol as Rol) : '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
