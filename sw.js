self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  let dados = {}
  try {
    dados = event.data.json()
  } catch {
    dados = { title: 'Berit', body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(dados.title || 'Berit', {
      body: dados.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: dados.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'))
})
