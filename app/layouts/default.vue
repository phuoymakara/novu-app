<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
const colorMode = useColorMode()
const { isSupported: notifSupported, permission, isSubscribed, enable: enableNotifications } = useNotifications()
const route = useRoute()
const { openConfirm } = useConfirm()
const { currentColor, currentNeutral, setColor, setNeutral, initTheme, primaryColors, neutralColors } = useTheme()

const sidebarOpen = ref(false)
const sidebarRef = ref<HTMLElement | null>(null)

const navigation = [
  { label: 'Dashboard', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: 'Tasks', to: '/tasks', icon: 'i-lucide-check-square' },
  { label: 'Habits', to: '/habits', icon: 'i-lucide-flame' },
  { label: 'Notes', to: '/notes', icon: 'i-lucide-notebook' },
]

const { lg } = useBreakpoints({ lg: 1024 })
watch(lg, (isLg) => { if (isLg) sidebarOpen.value = false })
onClickOutside(sidebarRef, () => { if (!lg.value) sidebarOpen.value = false })
watch(() => route.path, () => { sidebarOpen.value = false })

onMounted(initTheme)

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  navigateTo('/login')
}

function confirmLogout() {
  openConfirm(
    'Sign out?',
    "You'll need to sign in again to access your data.",
    logout,
    { confirmLabel: 'Sign out' },
  )
}

const isActive = (to: string) => to === '/' ? route.path === '/' : route.path.startsWith(to)

const pageTitle = computed(() => {
  const match = navigation.find(n => isActive(n.to))
  return match?.label ?? 'DailyOS'
})

const userMenuItems = computed(() => [
  [
    { label: 'Profile', icon: 'i-lucide-user' },
    { label: 'Billing', icon: 'i-lucide-credit-card' },
    { label: 'Settings', icon: 'i-lucide-settings' },
  ],
  [
    {
      label: 'Theme',
      icon: 'i-lucide-palette',
      children: [[
        {
          label: 'Primary',
          trailingIcon: 'i-lucide-chevron-right',
          children: [primaryColors.map(c => ({
            label: c.label,
            chip: { color: c.value },
            trailingIcon: currentColor.value === c.value ? 'i-lucide-check' : undefined,
            onSelect: () => setColor(c.value),
          }))],
        },
        {
          label: 'Neutral',
          trailingIcon: 'i-lucide-chevron-right',
          children: [neutralColors.map(c => ({
            label: c.label,
            chip: { color: c.value },
            trailingIcon: currentNeutral.value === c.value ? 'i-lucide-check' : undefined,
            onSelect: () => setNeutral(c.value),
          }))],
        },
      ]],
    },
    {
      label: colorMode.value === 'dark' ? 'Light mode' : 'Dark mode',
      icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
      onSelect: () => { colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark' },
    },
  ],
  [
    {
      label: 'Log out',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: confirmLogout,
    },
  ],
])
</script>

<template>
  <div class="min-h-screen bg-background">
    <template v-if="loggedIn">
      <div class="flex h-screen overflow-hidden">

        <!-- Mobile overlay -->
        <Transition name="fade">
          <div
            v-if="sidebarOpen"
            class="fixed inset-0 bg-black/50 z-30 lg:hidden"
            @click="sidebarOpen = false"
          />
        </Transition>

        <!-- Sidebar -->
        <aside
          ref="sidebarRef"
          class="fixed lg:static inset-y-0 left-0 z-40 w-56 flex-shrink-0 border-r border-gray-200 bg-background flex flex-col transition-transform duration-300"
          :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
        >
          <!-- Logo -->
          <div class="px-4 py-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <UIcon name="i-lucide-sun" class="text-white text-sm" />
              </div>
              <span class="text-base font-semibold tracking-tight">DailyOS</span>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="xs"
              color="neutral"
              class="lg:hidden"
              @click="sidebarOpen = false"
            />
          </div>

          <!-- Nav -->
          <nav class="flex-1 px-3 py-2 space-y-0.5">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="isActive(item.to)
                ? 'text-primary bg-primary-100/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
            >
              <UIcon :name="item.icon" class="text-base flex-shrink-0" />
              {{ item.label }}
            </NuxtLink>
          </nav>

          <!-- User section with dropdown -->
          <div class="p-2 border-t border-gray-200">
            <UDropdownMenu
              :items="userMenuItems"
              :content="{ align: 'start', side: 'top', sideOffset: 4 }"
              class="w-full"
            >
              <button class="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors text-left">
                <UAvatar :alt="user?.name" size="sm" class="shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate leading-tight">{{ user?.name }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ user?.email }}</p>
                </div>
                <UIcon name="i-lucide-chevrons-up-down" class="text-muted-foreground text-xs shrink-0" />
              </button>
            </UDropdownMenu>
          </div>
        </aside>

        <!-- Right side: mobile header + content -->
        <div class="flex-1 flex flex-col overflow-hidden min-w-0">
          <!-- Mobile top bar -->
          <header class="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-background shrink-0">
            <div class="flex items-center gap-2 flex-1">
              <div class="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <UIcon name="i-lucide-sun" class="text-white text-xs" />
              </div>
              <span class="font-semibold text-sm">{{ pageTitle }}</span>
            </div>
            <UButton
              :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
            />
            <UTooltip
              v-if="notifSupported"
              :text="isSubscribed ? 'Notifications on' : permission === 'denied' ? 'Notifications blocked' : 'Enable notifications'"
            >
              <UButton
                :icon="isSubscribed ? 'i-lucide-bell' : 'i-lucide-bell-off'"
                :color="isSubscribed ? 'primary' : 'neutral'"
                variant="ghost"
                size="sm"
                :disabled="permission === 'denied'"
                @click="enableNotifications"
              />
            </UTooltip>
            <UButton
              icon="i-lucide-log-out"
              color="error"
              variant="ghost"
              size="sm"
              @click="confirmLogout"
            />
          </header>

          <!-- Page content -->
          <main class="flex-1 overflow-y-auto pb-16 lg:pb-0">
            <slot />
          </main>

          <!-- Mobile bottom navigation -->
          <nav class="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-background border-t border-gray-200 flex">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors"
              :class="isActive(item.to) ? 'text-primary' : 'text-muted-foreground'"
            >
              <UIcon :name="item.icon" class="text-lg" />
              <span class="text-[10px]">{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </div>

      </div>
    </template>

    <template v-else>
      <slot />
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
