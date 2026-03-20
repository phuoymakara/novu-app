<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user } = useUserSession()
const { data: tasks } = await useFetch('/api/tasks')
const { data: habits } = await useFetch('/api/habits')

const hour = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

const stats = computed(() => {
  const all = tasks.value ?? []
  return {
    todo: all.filter(t => t.status === 'todo').length,
    inProgress: all.filter(t => t.status === 'in_progress').length,
    done: all.filter(t => t.status === 'done').length,
  }
})

const habitProgress = computed(() => {
  const all = habits.value ?? []
  if (!all.length) return 0
  return Math.round((all.filter((h: any) => h.completedToday).length / all.length) * 100)
})

const recentTasks = computed(() => (tasks.value ?? []).slice(0, 5))

const priorityColor = (p: string) => p === 'high' ? 'error' : p === 'medium' ? 'warning' : 'neutral'
</script>

<template>
  <div class="p-4 lg:p-8 max-w-5xl mx-auto space-y-6 lg:space-y-8">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-muted-foreground">{{ today }}</p>
        <h1 class="text-3xl font-bold mt-1">{{ greeting }}, {{ user?.name?.split(' ')[0] }} 👋</h1>
      </div>
      <UButton to="/tasks" icon="i-lucide-plus" size="sm">New Task</UButton>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard class="hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-list-todo" class="text-primary text-xl" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ stats.todo }}</p>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">To Do</p>
          </div>
        </div>
      </UCard>

      <UCard class="hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-timer" class="text-warning text-xl" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ stats.inProgress }}</p>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">In Progress</p>
          </div>
        </div>
      </UCard>

      <UCard class="hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-check-circle-2" class="text-success text-xl" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ stats.done }}</p>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Completed</p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Tasks -->
      <div class="lg:col-span-2">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Recent Tasks</h2>
              <UButton to="/tasks" variant="ghost" size="xs" trailing-icon="i-lucide-arrow-right" color="neutral">
                View all
              </UButton>
            </div>
          </template>

          <div v-if="recentTasks.length" class="divide-y divide-border -mx-4 -my-2">
            <div
              v-for="task in recentTasks"
              :key="task.id"
              class="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div
                class="w-1.5 h-8 rounded-full flex-shrink-0"
                :class="task.priority === 'high' ? 'bg-error' : task.priority === 'medium' ? 'bg-warning' : 'bg-muted-foreground/30'"
              />
              <UIcon
                :name="task.status === 'done' ? 'i-lucide-check-circle-2' : 'i-lucide-circle-dashed'"
                :class="task.status === 'done' ? 'text-success' : 'text-muted-foreground'"
                class="text-lg flex-shrink-0"
              />
              <span
                class="flex-1 text-sm truncate"
                :class="task.status === 'done' ? 'line-through text-muted-foreground' : ''"
              >{{ task.title }}</span>
              <UBadge :color="priorityColor(task.priority)" variant="soft" size="sm">
                {{ task.priority }}
              </UBadge>
            </div>
          </div>

          <div v-else class="py-10 text-center text-muted-foreground">
            <UIcon name="i-lucide-inbox" class="text-4xl mb-2" />
            <p class="text-sm">No tasks yet.</p>
            <UButton to="/tasks" size="sm" variant="ghost" class="mt-2">Add your first task</UButton>
          </div>
        </UCard>
      </div>

      <!-- Right column -->
      <div class="space-y-4">
        <!-- Habit progress -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Habits Today</h2>
              <UButton to="/habits" variant="ghost" size="xs" trailing-icon="i-lucide-arrow-right" color="neutral">
                View all
              </UButton>
            </div>
          </template>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">{{ habits?.filter((h: any) => h.completedToday).length ?? 0 }} / {{ habits?.length ?? 0 }} done</span>
              <span class="font-bold text-primary">{{ habitProgress }}%</span>
            </div>
            <div class="w-full bg-muted rounded-full h-2.5">
              <div
                class="h-2.5 rounded-full bg-primary transition-all duration-700"
                :style="{ width: `${habitProgress}%` }"
              />
            </div>
            <p v-if="habitProgress === 100" class="text-xs text-success flex items-center gap-1">
              <UIcon name="i-lucide-party-popper" /> All habits done today!
            </p>
            <p v-else-if="!habits?.length" class="text-xs text-muted-foreground">
              No habits tracked yet.
            </p>
          </div>
        </UCard>

        <!-- Quick links -->
        <UCard>
          <template #header>
            <h2 class="font-semibold">Quick Access</h2>
          </template>
          <div class="space-y-1 -mx-1">
            <NuxtLink
              to="/tasks"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
            >
              <UIcon name="i-lucide-check-square" class="text-primary" />
              <span class="text-sm font-medium">Tasks</span>
            </NuxtLink>
            <NuxtLink
              to="/habits"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
            >
              <UIcon name="i-lucide-flame" class="text-warning" />
              <span class="text-sm font-medium">Habits</span>
            </NuxtLink>
            <NuxtLink
              to="/notes"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
            >
              <UIcon name="i-lucide-notebook" class="text-info" />
              <span class="text-sm font-medium">Notes</span>
            </NuxtLink>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
