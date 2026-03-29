declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: { url: string; revision: string | null }[] }

// Force activate immediately — skip waiting for old SW
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

// Required reference so vite-pwa injects the asset manifest (enables PWA caching)
void self.__WB_MANIFEST

// Push: show notification
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

// Notification click: focus existing window or open new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url: string = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return (client as WindowClient).focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
