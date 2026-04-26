import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Verificar que el usuario es carpintero
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.rol !== 'carpintero') {
    return NextResponse.json({ error: 'Solo los carpinteros pueden vincular su cuenta de Mercado Pago' }, { status: 403 })
  }

  const appId = process.env.MERCADOPAGO_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/callback`

  if (!appId) {
    return NextResponse.json({ error: 'MERCADOPAGO_APP_ID no configurado' }, { status: 500 })
  }

  const authUrl = new URL('https://auth.mercadopago.com.ar/authorization')
  authUrl.searchParams.set('client_id', appId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('platform_id', 'mp')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  // Pasar el user_id como state para validarlo en el callback
  authUrl.searchParams.set('state', user.id)

  return NextResponse.redirect(authUrl.toString())
}
