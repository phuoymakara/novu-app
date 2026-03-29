export function useNotifications() {
  const config = useRuntimeConfig()
  const isSupported = computed(() =>
    import.meta.client
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window
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
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    isSubscribed.value = !!sub
  }

  async function subscribe() {
    loading.value = true
    try {
      const reg = await navigator.serviceWorker.ready
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
    }
    finally {
      loading.value = false
    }
  }

  async function enable() {
    if (!isSupported.value) return
    const result = await Notification.requestPermission()
    permission.value = result
    if (result === 'granted') await subscribe()
  }

  async function sendTest() {
    await $fetch('/api/push/send', {
      method: 'POST',
      body: { title: 'DailyOS', body: 'Notifications are working!', url: '/' },
    })
  }

  onMounted(checkSubscription)

  return { isSupported, permission, isSubscribed, loading, enable, sendTest }
}
