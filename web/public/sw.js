self.addEventListener('push', function (event) {
  let data = {
    title: '!!! NOTFALL !!!',
    body: 'Angelika braucht sofort Hilfe.',
    url: '/dashboard?panic=open',
    tag: 'panic-alert',
    renotify: true,
    requireInteraction: true,
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data = { ...data, body: event.data.text() }
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '!!! NOTFALL !!!', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'panic-alert',
      renotify: data.renotify !== false,
      requireInteraction: data.requireInteraction === true,
      data: {
        url: data.url || '/dashboard?panic=open',
      },
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const targetUrl =
    (event.notification && event.notification.data && event.notification.data.url) ||
    '/dashboard?panic=open'

  event.waitUntil(clients.openWindow(targetUrl))
})
