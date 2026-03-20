import { useConfirmStore } from '~/stores/confirm'

export function useConfirm() {
  const store = useConfirmStore()

  function openConfirm(
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: { confirmLabel?: string, confirmColor?: string },
  ) {
    store.openConfirm({
      title,
      message,
      onConfirm,
      confirmLabel: options?.confirmLabel,
      confirmColor: options?.confirmColor,
    })
  }

  return { openConfirm }
}
