import webpush from 'web-push'
import type { SupabaseClient } from '@supabase/supabase-js'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@cjexpertos.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function enviarPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    )
    return true
  } catch {
    return false
  }
}

export async function notificarUsuario(
  usuarioId: string,
  payload: PushPayload,
  supabase: SupabaseClient
): Promise<void> {
  const { data: suscripciones } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('usuario_id', usuarioId)

  if (!suscripciones?.length) return

  await Promise.allSettled(
    suscripciones.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      enviarPush(sub, payload)
    )
  )
}
