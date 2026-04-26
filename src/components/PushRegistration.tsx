'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}

export default function PushRegistration() {
  const [status, setStatus] = useState<'idle' | 'subscribed' | 'denied' | 'unsupported'>('idle')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => {
        if (sub) setStatus('subscribed')
      })
    )
  }, [])

  const handleToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    if (status === 'subscribed') {
      setLoading(true)
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
          setStatus('idle')
        }
      } finally {
        setLoading(false)
      }
      return
    }

    const perm = await Notification.requestPermission()
    if (perm !== 'granted') {
      setStatus('denied')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/push/vapid-public-key')
      const { key } = await res.json() as { key: string }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })

      const keys = sub.getKey
        ? {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
          }
        : { p256dh: '', auth: '' }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, ...keys }),
      })

      setStatus('subscribed')
    } catch (e) {
      console.error('Push subscription error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'unsupported') return null

  return (
    <button
      onClick={handleToggle}
      disabled={loading || status === 'denied'}
      title={
        status === 'subscribed'
          ? 'Desactivar notificaciones push'
          : status === 'denied'
          ? 'Notificaciones bloqueadas por el navegador'
          : 'Activar notificaciones push'
      }
      className={`p-2 rounded-xl transition-colors ${
        status === 'subscribed'
          ? 'bg-green-100 text-green-600 hover:bg-green-200'
          : status === 'denied'
          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : status === 'subscribed' ? (
        <Bell size={16} />
      ) : (
        <BellOff size={16} />
      )}
    </button>
  )
}
