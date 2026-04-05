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

  useEffect(() => {
    async function run() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('Push auf diesem Gerät nicht verfügbar')
        return
      }

      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setStatus('Push nicht erlaubt')
          return
        }

        const registration = await navigator.serviceWorker.register('/sw.js')
        const existing = await registration.pushManager.getSubscription()

        let subscription = existing
        if (!subscription) {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          if (!vapidKey) {
            setStatus('VAPID Public Key fehlt')
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
          return
        }

        setStatus('Push aktiviert')
      } catch (error) {
        console.error(error)
        setStatus('Push-Registrierung fehlgeschlagen')
      }
    }

    run()
  }, [])

  return <div className="mt-3 text-sm text-[var(--muted)]">{status}</div>
}
