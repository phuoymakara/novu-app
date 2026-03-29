// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
  ],

  ui: {
    theme: {
      colors: ['primary', 'secondary', 'info', 'success', 'warning', 'error'],
    },
  },

  css: ['~/assets/css/main.css'],

  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit'],
    },
  },

  runtimeConfig: {
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    vapidEmail: process.env.VAPID_EMAIL || 'mailto:admin@dailyos.app',
    public: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    },
  },

  pwa: {
    strategies: 'injectManifest',
    srcDir: '.',
    filename: 'sw.ts',
    registerType: 'autoUpdate',
    manifest: {
      name: 'DailyOS',
      short_name: 'DailyOS',
      description: 'Your personal daily operating system',
      theme_color: '#22c55e',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      type: 'module',
    },
  },
})
