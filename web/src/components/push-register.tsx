'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export default function PushRegister() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('Push auf diesem Gerät nicht verfügbar')
      return
    }

    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        setStatus('Push bereits erlaubt')
      } else if (Notification.permission === 'denied') {
        setStatus('Push im Gerät blockiert')
      } else {
        setStatus('Push noch nicht aktiviert')
      }
    }
  }, [])

  async function activatePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('Push auf diesem Gerät nicht verfügbar')
      return
    }

    try {
      setLoading(true)

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(`Push nicht erlaubt (${permission})`)
        setLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      const existing = await registration.pushManager.getSubscription()

      let subscription = existing
      if (!subscription) {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) {
          setStatus('VAPID Public Key fehlt')
          setLoading(false)
          return
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      }

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setStatus(data?.error || 'Push konnte nicht gespeichert werden')
        setLoading(false)
        return
      }

      setStatus('Push aktiviert')
      setLoading(false)
    } catch (error) {
      console.error(error)
      setStatus('Push-Registrierung fehlgeschlagen')
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="text-sm text-[var(--muted)]">{status}</div>
      <button
        type="button"
        onClick={activatePush}
        disabled={loading}
        className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-white"
      >
        {loading ? 'Aktiviere Push ...' : 'Push aktivieren'}
      </button>
    </div>
  )
}
