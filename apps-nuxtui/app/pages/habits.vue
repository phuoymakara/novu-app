<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useToast()
const { openConfirm } = useConfirm()
const { data: habits, refresh } = await useFetch('/api/habits')

const showModal = ref(false)
const loading = ref(false)
const form = reactive({ name: '', icon: 'i-lucide-check', color: 'primary' })

const colorOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Info', value: 'info' },
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
]

const colorMap: Record<string, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
}

const iconOptions = [
  'i-lucide-check',
  'i-lucide-dumbbell',
  'i-lucide-book-open',
  'i-lucide-droplets',
  'i-lucide-moon',
  'i-lucide-apple',
  'i-lucide-bike',
  'i-lucide-heart',
  'i-lucide-coffee',
  'i-lucide-pen',
  'i-lucide-music',
  'i-lucide-sun',
  'i-lucide-walk',
  'i-lucide-brain',
  'i-lucide-salad',
  'i-lucide-bed',
]

async function createHabit() {
  loading.value = true
  try {
    await $fetch('/api/habits', { method: 'POST', body: form })
    toast.add({ title: 'Habit created!', color: 'success' })
    showModal.value = false
    Object.assign(form, { name: '', icon: 'i-lucide-check', color: 'primary' })
    await refresh()
  }
  catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.message, color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function toggleHabit(habit: any) {
  await $fetch(`/api/habits/${habit.id}/toggle`, { method: 'POST' })
  await refresh()
}

function confirmDelete(habit: any) {
  openConfirm(
    'Delete habit?',
    `'${habit.name}' and its ${habit.streak ?? 0}-day streak will be permanently deleted.`,
    async () => {
      await $fetch(`/api/habits/${habit.id}`, { method: 'DELETE' })
      toast.add({ title: 'Habit deleted', color: 'neutral' })
      await refresh()
    },
  )
}

const completedCount = computed(() => (habits.value ?? []).filter((h: any) => h.completedToday).length)
const total = computed(() => (habits.value ?? []).length)
const progress = computed(() => total.value ? Math.round((completedCount.value / total.value) * 100) : 0)
</script>

<template>
  <div class="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Habits</h1>
        <p class="text-sm text-muted-foreground mt-0.5">Build consistency, one day at a time</p>
      </div>
      <UButton icon="i-lucide-plus" @click="showModal = true">New Habit</UButton>
    </div>

    <!-- Progress card -->
    <UCard v-if="total > 0">
      <div class="flex items-center justify-between mb-3">
        <div>
          <p class="font-semibold">Today's Progress</p>
          <p class="text-sm text-muted-foreground">{{ completedCount }} of {{ total }} habits completed</p>
        </div>
        <div
          class="text-3xl font-bold transition-all"
          :class="progress === 100 ? 'text-success' : 'text-primary'"
        >
          {{ progress }}%
        </div>
      </div>
      <div class="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-700 ease-out"
          :class="progress === 100 ? 'bg-success' : 'bg-primary'"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <p v-if="progress === 100" class="text-sm text-success mt-3 flex items-center gap-1.5 font-medium">
        <UIcon name="i-lucide-party-popper" /> Amazing! You completed all habits today!
      </p>
    </UCard>

    <!-- Habits grid -->
    <div v-if="habits?.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="habit in habits"
        :key="habit.id"
        class="bg-card border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all"
        :class="habit.completedToday ? 'border-primary/30 bg-primary/5' : 'border-gray-200'"
      >
        <!-- Toggle button -->
        <button
          class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
          :class="habit.completedToday
            ? `${colorMap[habit.color] ?? 'bg-primary'} text-white shadow-lg`
            : 'bg-muted hover:bg-muted-foreground/15 text-muted-foreground'"
          @click="toggleHabit(habit)"
        >
          <UIcon :name="habit.completedToday ? 'i-lucide-check' : (habit.icon ?? 'i-lucide-circle')" class="text-xl" />
        </button>

        <div class="flex-1 min-w-0">
          <p
            class="font-medium leading-tight"
            :class="habit.completedToday ? 'text-muted-foreground line-through' : ''"
          >
            {{ habit.name }}
          </p>
          <div class="flex items-center gap-1.5 mt-1">
            <UIcon name="i-lucide-flame" class="text-warning text-sm" />
            <span class="text-xs text-muted-foreground">
              {{ habit.streak ?? 0 }} day streak
            </span>
          </div>
        </div>

        <UButton
          icon="i-lucide-trash-2"
          variant="ghost"
          size="sm"
          color="error"
          class="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
          @click="confirmDelete(habit)"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="py-24 text-center text-muted-foreground">
      <div class="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-lucide-flame" class="text-3xl text-warning" />
      </div>
      <p class="font-semibold text-foreground">No habits yet</p>
      <p class="text-sm mt-1 max-w-xs mx-auto">Start building a routine. Add your first habit and track it daily.</p>
      <UButton class="mt-5" @click="showModal = true">Add your first habit</UButton>
    </div>

    <!-- Create Modal -->
    <UModal v-model:open="showModal" title="New Habit">
      <template #body>
        <UForm :state="form" class="space-y-5" @submit="createHabit">
          <UFormField label="Habit name" name="name" required>
            <UInput v-model="form.name" placeholder="e.g. Drink 8 glasses of water" class="w-full" autofocus />
          </UFormField>

          <UFormField label="Pick an icon" name="icon">
            <div class="grid grid-cols-8 gap-1.5">
              <button
                v-for="icon in iconOptions"
                :key="icon"
                type="button"
                class="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                :class="form.icon === icon
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'"
                @click="form.icon = icon"
              >
                <UIcon :name="icon" class="text-base" />
              </button>
            </div>
          </UFormField>

          <UFormField label="Color theme" name="color">
            <USelect v-model="form.color" :items="colorOptions" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <UButton variant="ghost" color="neutral" @click="showModal = false">Cancel</UButton>
            <UButton type="submit" :loading="loading">Create habit</UButton>
          </div>
        </UForm>
      </template>
    </UModal>

  </div>
</template>
