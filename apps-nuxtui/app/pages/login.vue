<script setup lang="ts">
definePageMeta({ auth: false })

const { fetch: refreshSession } = useUserSession()
const toast = useToast()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const loading = ref(false)

async function login() {
  loading.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: form })
    await refreshSession()
    router.push('/')
  }
  catch (err: any) {
    toast.add({ title: 'Login failed', description: err.data?.message, color: 'error' })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="flex items-center gap-3 justify-center py-2">
          <UIcon name="i-lucide-sun" class="text-primary text-3xl" />
          <h1 class="text-2xl font-bold">DailyOS</h1>
        </div>
        <p class="text-center text-muted-foreground text-sm mt-1">Sign in to your account</p>
      </template>

      <UForm :state="form" class="space-y-4" @submit="login">
        <UFormField label="Email" name="email">
          <UInput v-model="form.email" type="email" placeholder="you@example.com" class="w-full" />
        </UFormField>
        <UFormField label="Password" name="password">
          <UInput v-model="form.password" type="password" placeholder="••••••••" class="w-full" />
        </UFormField>
        <UButton type="submit" class="w-full justify-center" :loading="loading">
          Sign in
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-muted-foreground">
          Don't have an account?
          <NuxtLink to="/register" class="text-primary hover:underline">Sign up</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
