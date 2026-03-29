import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'DailyOS', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
