export function useNotifications() {
  const config = useRuntimeConfig()
  const toast = useToast()

  const isSupported = computed(() =>
    import.meta.client
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && window.isSecureContext // requires HTTPS or localhost
  )
  const permission = ref<NotificationPermission>('default')
  const isSubscribed = ref(false)
  const loading = ref(false)

  function urlBase64ToUint8Array(base64: string) {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(b64)
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
  }

  async function checkSubscription() {
    if (!isSupported.value) return
    permission.value = Notification.permission
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      isSubscribed.value = !!sub
    }
    catch (e) {
      console.warn('[Push] Could not check subscription:', e)
    }
  }

  async function subscribe() {
    loading.value = true
    try {
      if (!config.public.vapidPublicKey) {
        throw new Error('VAPID public key is not configured on the server.')
      }

      // On iOS the SW can take a long time to install/activate (precaching assets).
      // Try the current controller's registration first, then fall back to ready.
      let reg: ServiceWorkerRegistration | undefined
      if (navigator.serviceWorker.controller) {
        const regs = await navigator.serviceWorker.getRegistrations()
        reg = regs.find(r => r.active === navigator.serviceWorker.controller)
      }
      if (!reg) {
        reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Service worker is still setting up. Please wait a moment and try again.')), 30000)
          ),
        ])
      }

      // Unsubscribe from any old subscription first (handles VAPID key rotation)
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.public.vapidPublicKey),
      })

      const json = sub.toJSON()
      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: { endpoint: json.endpoint, keys: json.keys },
      })

      isSubscribed.value = true
      permission.value = 'granted'
      toast.add({ title: 'Notifications enabled', color: 'success' })
    }
    catch (err: any) {
      isSubscribed.value = false
      const name = err?.name ? `${err.name}: ` : ''
      const msg = err?.data?.message ?? err?.message ?? 'Unknown error'
      console.error('[Push] Subscription failed:', err)
      toast.add({ title: 'Could not enable notifications', description: name + msg, color: 'error', duration: 12000 })
    }
    finally {
      loading.value = false
    }
  }

  async function enable() {
    if (loading.value) return // prevent double-tap
    if (!isSupported.value) {
      const reason = !window.isSecureContext
        ? 'Push notifications require HTTPS. Access the app via your HTTPS domain.'
        : 'Push notifications are not supported on this browser.'
      toast.add({ title: 'Not supported', description: reason, color: 'warning' })
      return
    }

    // iOS only supports push for installed PWAs (added to Home Screen)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || !!(navigator as any).standalone
    if (isIOS && !isInstalled) {
      toast.add({
        title: 'Install app first',
        description: 'On iOS, tap Share → "Add to Home Screen", then open DailyOS from your Home Screen to enable notifications.',
        color: 'warning',
        duration: 8000,
      })
      return
    }

    const result = await Notification.requestPermission()
    permission.value = result
    if (result === 'granted') {
      await subscribe()
    }
    else if (result === 'denied') {
      toast.add({ title: 'Notifications blocked', description: 'Enable notifications in your browser settings.', color: 'warning' })
    }
  }

  async function sendTest() {
    try {
      await $fetch('/api/push/send', {
        method: 'POST',
        body: { title: 'DailyOS', body: 'Notifications are working!', url: '/' },
      })
      toast.add({ title: 'Test sent', color: 'success' })
    }
    catch (err: any) {
      toast.add({ title: 'Send failed', description: err?.data?.message, color: 'error' })
    }
  }

  onMounted(checkSubscription)

  return { isSupported, permission, isSubscribed, loading, enable, sendTest }
}
