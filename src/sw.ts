import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist, NetworkFirst, CacheFirst, ExpirationPlugin } from 'serwist'

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: /^https:\/\/.*\.supabase\.co\/.*/,
      handler: new NetworkFirst({
        cacheName: 'supabase-cache',
        plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 })],
      }),
    },
    {
      matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: new CacheFirst({
        cacheName: 'image-cache',
        plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
  ],
})

serwist.addEventListeners()

// ─── Push Notifications ───────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const swSelf = self as unknown as any

swSelf.addEventListener('push', (event: { data?: { json: () => unknown; text: () => string }; waitUntil: (p: Promise<unknown>) => void }) => {
  if (!event.data) return

  let payload: { title?: string; body?: string; url?: string } = {}
  try {
    payload = event.data.json() as { title?: string; body?: string; url?: string }
  } catch {
    payload = { title: 'CJ Expertos', body: event.data.text() }
  }

  const title = payload.title ?? 'CJ Expertos'
  const options = {
    body: payload.body ?? '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: payload.url ?? '/' },
  }

  event.waitUntil(
    (swSelf.registration as { showNotification: (title: string, opts: unknown) => Promise<void> })
      .showNotification(title, options)
  )
})

swSelf.addEventListener('notificationclick', (event: { notification: { close: () => void; data: { url?: string } }; waitUntil: (p: Promise<unknown>) => void }) => {
  event.notification.close()
  const url: string = event.notification.data?.url ?? '/'
  event.waitUntil(
    (swSelf.clients as { matchAll: (opts: unknown) => Promise<{ url: string; focus: () => Promise<unknown> }[]>; openWindow: (url: string) => Promise<unknown> })
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list: { url: string; focus: () => Promise<unknown> }[]) => {
        for (const client of list) {
          if (client.url === url) return client.focus()
        }
        return swSelf.clients.openWindow(url) as Promise<unknown>
      })
  )
})
