export const primaryColors = [
  { label: 'Red', value: 'red', hex: '#ef4444' },
  { label: 'Orange', value: 'orange', hex: '#f97316' },
  { label: 'Amber', value: 'amber', hex: '#f59e0b' },
  { label: 'Yellow', value: 'yellow', hex: '#eab308' },
  { label: 'Lime', value: 'lime', hex: '#84cc16' },
  { label: 'Green', value: 'green', hex: '#22c55e' },
  { label: 'Emerald', value: 'emerald', hex: '#10b981' },
  { label: 'Teal', value: 'teal', hex: '#14b8a6' },
  { label: 'Cyan', value: 'cyan', hex: '#06b6d4' },
  { label: 'Sky', value: 'sky', hex: '#0ea5e9' },
  { label: 'Blue', value: 'blue', hex: '#3b82f6' },
  { label: 'Indigo', value: 'indigo', hex: '#6366f1' },
  { label: 'Violet', value: 'violet', hex: '#8b5cf6' },
  { label: 'Purple', value: 'purple', hex: '#a855f7' },
  { label: 'Fuchsia', value: 'fuchsia', hex: '#d946ef' },
  { label: 'Pink', value: 'pink', hex: '#ec4899' },
  { label: 'Rose', value: 'rose', hex: '#f43f5e' },
]

export const neutralColors = [
  { label: 'Slate', value: 'slate', hex: '#64748b' },
  { label: 'Gray', value: 'gray', hex: '#6b7280' },
  { label: 'Zinc', value: 'zinc', hex: '#71717a' },
  { label: 'Neutral', value: 'neutral', hex: '#737373' },
  { label: 'Stone', value: 'stone', hex: '#78716c' },
]

// Keep backward compat alias
export const themeColors = primaryColors

export function useTheme() {
  const appConfig = useAppConfig()
  const savedColor = useLocalStorage('dailyos-theme-color', 'violet')
  const savedNeutral = useLocalStorage('dailyos-theme-neutral', 'zinc')

  const currentColor = computed(
    () => (appConfig.ui as any)?.colors?.primary ?? 'violet',
  )

  const currentNeutral = computed(
    () => (appConfig.ui as any)?.colors?.neutral ?? 'zinc',
  )

  function setColor(color: string) {
    ;(appConfig.ui as any).colors.primary = color
    savedColor.value = color
  }

  function setNeutral(color: string) {
    ;(appConfig.ui as any).colors.neutral = color
    savedNeutral.value = color
  }

  function initTheme() {
    if (savedColor.value) setColor(savedColor.value)
    if (savedNeutral.value) setNeutral(savedNeutral.value)
  }

  return { currentColor, currentNeutral, setColor, setNeutral, initTheme, themeColors, primaryColors, neutralColors }
}
