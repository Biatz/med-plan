self.addEventListener('push', function (event) {
  let data = {
    title: 'Med-Plan',
    body: 'Neue Benachrichtigung',
  }

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { title: 'Med-Plan', body: event.data.text() }
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Med-Plan', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(clients.openWindow('/dashboard'))
})
