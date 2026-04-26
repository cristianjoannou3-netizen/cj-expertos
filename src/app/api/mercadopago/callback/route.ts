import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('[mp-callback] Error de autorización MP:', error)
    return NextResponse.redirect(`${baseUrl}/perfil?mp_error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/perfil?mp_error=sin_codigo`)
  }

  // Validar state (debe coincidir con el user_id para evitar CSRF)
  if (state && state !== user.id) {
    console.error('[mp-callback] State inválido:', { state, userId: user.id })
    return NextResponse.redirect(`${baseUrl}/perfil?mp_error=state_invalido`)
  }

  const appId = process.env.MERCADOPAGO_APP_ID
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET
  const redirectUri = `${baseUrl}/api/mercadopago/callback`

  if (!appId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/perfil?mp_error=configuracion_incompleta`)
  }

  try {
    // Intercambiar code por access_token
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: appId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text()
      console.error('[mp-callback] Error al obtener token:', tokenErr)
      return NextResponse.redirect(`${baseUrl}/perfil?mp_error=token_fallido`)
    }

    const tokenData = await tokenRes.json() as {
      access_token: string
      refresh_token: string
      user_id: number
      token_type: string
    }

    // Guardar tokens y mp_user_id en perfiles
    const { error: updateErr } = await supabase
      .from('perfiles')
      .update({
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token,
        mp_user_id: String(tokenData.user_id),
      })
      .eq('id', user.id)

    if (updateErr) {
      console.error('[mp-callback] Error al guardar tokens:', updateErr.message)
      return NextResponse.redirect(`${baseUrl}/perfil?mp_error=guardado_fallido`)
    }

    return NextResponse.redirect(`${baseUrl}/perfil?mp_connected=true`)
  } catch (err) {
    console.error('[mp-callback] Error inesperado:', err)
    return NextResponse.redirect(`${baseUrl}/perfil?mp_error=error_interno`)
  }
}
