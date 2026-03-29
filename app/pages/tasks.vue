<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useToast()
const { openConfirm } = useConfirm()
const { data: tasks, refresh } = await useFetch('/api/tasks')

const showModal = ref(false)
const editingTask = ref<any>(null)
const form = reactive({ title: '', description: '', priority: 'medium', dueDate: '', remindAt: '' })
const reminderEnabled = ref(false)
const loading = ref(false)

const draggingTask = ref<any>(null)
const dragOverColumn = ref<string | null>(null)
const dragOverTaskId = ref<number | null>(null)
const dragOverHalf = ref<'top' | 'bottom'>('top')

const columns = [
  { key: 'todo', label: 'To Do', icon: 'i-lucide-circle', color: 'text-neutral-400' },
  { key: 'in_progress', label: 'In Progress', icon: 'i-lucide-circle-dot', color: 'text-warning' },
  { key: 'done', label: 'Done', icon: 'i-lucide-circle-check-big', color: 'text-success' },
]

const tasksByStatus = computed(() => ({
  todo: (tasks.value ?? []).filter(t => t.status === 'todo'),
  in_progress: (tasks.value ?? []).filter(t => t.status === 'in_progress'),
  done: (tasks.value ?? []).filter(t => t.status === 'done'),
}))

const today = new Date().toISOString().slice(0, 10)

function openCreate() {
  editingTask.value = null
  Object.assign(form, { title: '', description: '', priority: 'medium', dueDate: today, remindAt: '' })
  reminderEnabled.value = false
  showModal.value = true
}

function openEdit(task: any) {
  editingTask.value = task
  Object.assign(form, {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    dueDate: task.dueDate ?? '',
    remindAt: task.remindAt ?? '',
  })
  reminderEnabled.value = !!task.remindAt
  showModal.value = true
}

function confirmDelete(task: any) {
  openConfirm(
    'Delete task?',
    `'${task.title}' will be permanently deleted.`,
    async () => {
      await $fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      toast.add({ title: 'Task deleted', color: 'neutral' })
      await refresh()
    },
  )
}

async function save() {
  loading.value = true
  try {
    const payload = {
      ...form,
      remindAt: reminderEnabled.value && form.remindAt ? form.remindAt : null,
    }
    if (editingTask.value) {
      await $fetch(`/api/tasks/${editingTask.value.id}`, { method: 'PATCH', body: payload })
      toast.add({ title: 'Task updated', color: 'success' })
    }
    else {
      await $fetch('/api/tasks', { method: 'POST', body: payload })
      toast.add({ title: 'Task created', color: 'success' })
    }
    showModal.value = false
    await refresh()
  }
  catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.message, color: 'error' })
  }
  finally {
    loading.value = false
  }
}

function onDragStart(event: DragEvent, task: any) {
  draggingTask.value = task
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('taskId', String(task.id))
}

function onDragEnd() {
  draggingTask.value = null
  dragOverColumn.value = null
  dragOverTaskId.value = null
}

// Column background drop (cross-column, appends to end)
async function onDrop(status: string) {
  const task = draggingTask.value
  draggingTask.value = null
  dragOverColumn.value = null
  dragOverTaskId.value = null

  if (!task || task.status === status) return

  const local = tasks.value?.find(t => t.id === task.id)
  if (local) local.status = status

  try {
    await $fetch(`/api/tasks/${task.id}`, { method: 'PATCH', body: { status } })
  }
  catch {
    toast.add({ title: 'Failed to move task', color: 'error' })
  }
  await refresh()
}

// Card-level drag: track which half of the card we're hovering (for indicator)
function onDragOverCard(e: DragEvent, task: any) {
  dragOverTaskId.value = task.id
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  dragOverHalf.value = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom'
}

// Card drop: reorder within same column, or cross-column
async function onDropOnCard(event: DragEvent, targetTask: any, status: string) {
  // Recalculate half from actual drop position (don't rely on potentially stale ref)
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const half: 'top' | 'bottom' = event.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom'

  // Use dataTransfer as reliable fallback if ref was cleared
  const taskId = Number(event.dataTransfer?.getData('taskId'))
  const task = draggingTask.value ?? tasks.value?.find(t => t.id === taskId)

  draggingTask.value = null
  dragOverColumn.value = null
  dragOverTaskId.value = null

  if (!task || !tasks.value) return

  // Cross-column: update status, append to end
  if (task.status !== status) {
    const local = tasks.value.find(t => t.id === task.id)
    if (local) local.status = status
    try {
      await $fetch(`/api/tasks/${task.id}`, { method: 'PATCH', body: { status } })
    }
    catch {
      toast.add({ title: 'Failed to move task', color: 'error' })
    }
    await refresh()
    return
  }

  // Same column reorder
  if (task.id === targetTask.id) return

  const from = tasks.value.findIndex(t => t.id === task.id)
  if (from === -1) return
  tasks.value.splice(from, 1)
  const to = tasks.value.findIndex(t => t.id === targetTask.id)
  if (to === -1) { await refresh(); return }
  tasks.value.splice(half === 'bottom' ? to + 1 : to, 0, task)

  const colIds = tasks.value.filter(t => t.status === status).map(t => t.id)
  try {
    await $fetch('/api/tasks/reorder', { method: 'PATCH', body: { ids: colIds } })
  }
  catch {
    toast.add({ title: 'Failed to reorder', color: 'error' })
  }
  await refresh()
}

const priorityDot = (p: string) => p === 'high' ? 'bg-red-400' : p === 'medium' ? 'bg-amber-400' : 'bg-neutral-300 dark:bg-neutral-600'

const priorities = [
  { value: 'high', label: 'High', bg: 'bg-red-400', ring: 'ring-red-300' },
  { value: 'medium', label: 'Medium', bg: 'bg-amber-400', ring: 'ring-amber-300' },
  { value: 'low', label: 'Low', bg: 'bg-neutral-300 dark:bg-neutral-500', ring: 'ring-neutral-300' },
]
</script>

<template>
  <div class="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Tasks</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ tasksByStatus.done.length }} of {{ tasks?.length ?? 0 }} completed
        </p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">New Task</UButton>
    </div>

    <!-- Kanban board -->
    <div class="overflow-x-auto">
      <div class="flex gap-4 min-w-[640px]" style="min-height: 480px">
        <div
          v-for="col in columns"
          :key="col.key"
          class="flex-1 flex flex-col rounded-xl transition-all duration-150"
          :class="dragOverColumn === col.key
            ? 'bg-primary/5 ring-2 ring-primary/25'
            : 'bg-muted/50'"
          @dragover.prevent="dragOverColumn = col.key; dragOverTaskId = null"
          @dragleave="dragOverColumn = null"
          @drop.prevent="onDrop(col.key)"
        >
          <!-- Column header -->
          <div class="px-3 pt-3 pb-2 flex items-center gap-2 flex-shrink-0">
            <UIcon :name="col.icon" class="text-base" :class="col.color" />
            <span class="font-semibold text-sm">{{ col.label }}</span>
            <span class="ml-auto text-xs font-medium bg-background rounded-full px-2 py-0.5 border border-gray-200">
              {{ tasksByStatus[col.key as keyof typeof tasksByStatus].length }}
            </span>
          </div>

          <!-- Task cards -->
          <div class="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5">
            <div
              v-for="task in tasksByStatus[col.key as keyof typeof tasksByStatus]"
              :key="task.id"
              draggable="true"
              class="group bg-background border border-gray-200 rounded-xl px-3.5 py-3 select-none cursor-grab active:cursor-grabbing transition-all duration-150"
              :class="[
                draggingTask?.id === task.id ? 'opacity-40 scale-[0.97]' : 'hover:border-border hover:shadow-sm',
                dragOverTaskId === task.id && dragOverHalf === 'top' ? 'border-t-primary! border-t-2' : '',
                dragOverTaskId === task.id && dragOverHalf === 'bottom' ? 'border-b-primary! border-b-2' : '',
              ]"
              @dragstart="onDragStart($event, task)"
              @dragend="onDragEnd"
              @dragover.prevent.stop="onDragOverCard($event, task)"
              @drop.prevent.stop="onDropOnCard($event, task, col.key)"
            >
              <!-- Title row -->
              <div class="flex items-start gap-2">
                <span class="mt-1.25 w-1.5 h-1.5 rounded-full shrink-0" :class="priorityDot(task.priority ?? 'medium')" />
                <p
                  class="text-sm font-medium leading-snug flex-1 min-w-0"
                  :class="task.status === 'done' ? 'line-through text-muted-foreground' : ''"
                >
                  {{ task.title }}
                </p>
                <!-- Actions: visible on hover only -->
                <div class="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mt-0.5 -mr-1">
                  <UButton icon="i-lucide-pencil" variant="ghost" size="xs" color="neutral" @click.stop="openEdit(task)" />
                  <UButton icon="i-lucide-trash-2" variant="ghost" size="xs" color="error" @click.stop="confirmDelete(task)" />
                </div>
              </div>

              <p v-if="task.description" class="text-xs text-muted-foreground mt-1.5 ml-3.5 line-clamp-2 leading-relaxed">
                {{ task.description }}
              </p>

              <div v-if="task.dueDate || task.remindAt" class="mt-2 ml-3.5 flex items-center gap-2 flex-wrap">
                <span v-if="task.dueDate" class="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
                  <UIcon name="i-lucide-calendar" class="text-xs" />
                  {{ task.dueDate }}
                </span>
                <span v-if="task.remindAt" class="inline-flex items-center gap-1 text-[11px] text-primary/70">
                  <UIcon name="i-lucide-bell" class="text-xs" />
                  {{ new Date(task.remindAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
            </div>

            <div
              v-if="!tasksByStatus[col.key as keyof typeof tasksByStatus].length"
              class="py-10 text-center text-muted-foreground"
              :class="dragOverColumn === col.key ? 'opacity-60' : 'opacity-40'"
            >
              <UIcon name="i-lucide-inbox" class="text-3xl mb-2" />
              <p class="text-xs">Drop tasks here</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <UModal v-model:open="showModal" :ui="{ header: 'border-b-0 pb-0', body: 'pt-2' }">
      <template #header>
        <span class="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          {{ editingTask ? 'Edit Task' : 'New Task' }}
        </span>
      </template>

      <template #body>
        <UForm :state="form" @submit="save">
          <!-- Title -->
          <input
            v-model="form.title"
            placeholder="What needs to be done?"
            autofocus
            class="w-full bg-transparent outline-none text-lg font-semibold placeholder:text-muted-foreground/30 text-gray-900 dark:text-gray-100 mb-2"
          />

          <!-- Description -->
           <USeparator type="dashed" class="my-1"/>
          <textarea
            v-model="form.description"
            placeholder="Add a note..."
            rows="3"
            class="w-full bg-transparent outline-none resize-none text-sm text-muted-foreground placeholder:text-muted-foreground/30 leading-relaxed mb-4"
          />

          <!-- Divider -->
          <div class="border-t border-gray-100 dark:border-gray-800 mb-4" />

          <!-- Meta row -->
          <div class="flex items-center gap-4 mb-3">
            <!-- Priority dots -->
            <div class="flex items-center gap-1.5">
              <button
                v-for="p in priorities"
                :key="p.value"
                type="button"
                :title="p.label"
                class="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150"
                :class="form.priority === p.value
                  ? 'ring-2 ring-offset-2 ' + p.ring
                  : 'opacity-30 hover:opacity-60'"
                @click="form.priority = p.value"
              >
                <span class="w-2.5 h-2.5 rounded-full" :class="p.bg" />
              </button>
            </div>

            <div class="w-px h-4 bg-gray-200 dark:bg-gray-700" />

            <!-- Due date -->
            <AppDatePicker v-model="form.dueDate" placeholder="Due date" class="flex-1" />

            <div class="w-px h-4 bg-gray-200 dark:bg-gray-700" />

            <!-- Reminder bell toggle -->
            <UTooltip :text="reminderEnabled ? 'Remove reminder' : 'Set reminder'">
              <button
                type="button"
                class="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
                :class="reminderEnabled ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
                @click="reminderEnabled = !reminderEnabled; if (!reminderEnabled) form.remindAt = ''"
              >
                <UIcon :name="reminderEnabled ? 'i-lucide-bell' : 'i-lucide-bell-off'" class="text-base" />
              </button>
            </UTooltip>
          </div>

          <!-- Reminder datetime picker -->
          <Transition name="slide-down">
            <div v-if="reminderEnabled" class="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-bell" class="text-primary text-sm shrink-0" />
                <span class="text-xs font-medium text-primary">Reminder time</span>
              </div>
              <AppDateTimePicker v-model="form.remindAt" placeholder="Pick date & time" />
              <p class="text-[11px] text-muted-foreground">
                You'll get 4 reminders: early morning, 15 min before, on time, and an evening check-in.
              </p>
            </div>
          </Transition>

          <!-- Actions -->
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" size="sm" @click="showModal = false">Cancel</UButton>
            <UButton type="submit" size="sm" :loading="loading">
              {{ editingTask ? 'Save' : 'Create' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
