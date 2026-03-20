import { defineStore } from 'pinia'

interface ConfirmOptions {
  title?: string
  message?: string
  confirmLabel?: string
  confirmColor?: string
  onConfirm: () => void | Promise<void>
}

export const useConfirmStore = defineStore('confirm', () => {
  const open = ref(false)
  const title = ref('Are you sure?')
  const message = ref('This action cannot be undone.')
  const confirmLabel = ref('Confirm')
  const confirmColor = ref('error')
  const loading = ref(false)
  const onConfirmFn = ref<(() => void | Promise<void>) | null>(null)

  function openConfirm(options: ConfirmOptions) {
    title.value = options.title ?? 'Are you sure?'
    message.value = options.message ?? 'This action cannot be undone.'
    confirmLabel.value = options.confirmLabel ?? 'Confirm'
    confirmColor.value = options.confirmColor ?? 'error'
    onConfirmFn.value = options.onConfirm
    open.value = true
  }

  async function confirm() {
    if (!onConfirmFn.value) return
    loading.value = true
    try {
      await onConfirmFn.value()
      open.value = false
    }
    finally {
      loading.value = false
    }
  }

  function close() {
    open.value = false
  }

  return { open, title, message, confirmLabel, confirmColor, loading, openConfirm, confirm, close }
})
