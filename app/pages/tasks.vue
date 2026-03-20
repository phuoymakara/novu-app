<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useToast()
const { openConfirm } = useConfirm()
const { data: tasks, refresh } = await useFetch('/api/tasks')

const showModal = ref(false)
const editingTask = ref<any>(null)
const form = reactive({ title: '', description: '', priority: 'medium', dueDate: '' })
const loading = ref(false)

const statusFilter = ref('all')
const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
]

const filteredTasks = computed(() => {
  const all = tasks.value ?? []
  if (statusFilter.value === 'all') return all
  return all.filter(t => t.status === statusFilter.value)
})

const counts = computed(() => ({
  all: tasks.value?.length ?? 0,
  todo: tasks.value?.filter(t => t.status === 'todo').length ?? 0,
  in_progress: tasks.value?.filter(t => t.status === 'in_progress').length ?? 0,
  done: tasks.value?.filter(t => t.status === 'done').length ?? 0,
}))

function openCreate() {
  editingTask.value = null
  Object.assign(form, { title: '', description: '', priority: 'medium', dueDate: '' })
  showModal.value = true
}

function openEdit(task: any) {
  editingTask.value = task
  Object.assign(form, {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    dueDate: task.dueDate ?? '',
  })
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
    if (editingTask.value) {
      await $fetch(`/api/tasks/${editingTask.value.id}`, { method: 'PATCH', body: form })
      toast.add({ title: 'Task updated', color: 'success' })
    }
    else {
      await $fetch('/api/tasks', { method: 'POST', body: form })
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

async function updateStatus(task: any, status: string) {
  await $fetch(`/api/tasks/${task.id}`, { method: 'PATCH', body: { status } })
  await refresh()
}

const priorityColor = (p: string) => p === 'high' ? 'error' : p === 'medium' ? 'warning' : 'neutral'
const statusColor = (s: string) => s === 'done' ? 'success' : s === 'in_progress' ? 'warning' : 'neutral'

const priorityBorder = (p: string) => p === 'high'
  ? 'border-l-4 border-l-error'
  : p === 'medium'
    ? 'border-l-4 border-l-warning'
    : 'border-l-4 border-l-neutral-200 dark:border-l-neutral-700'
</script>

<template>
  <div class="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Tasks</h1>
        <p class="text-sm text-muted-foreground mt-0.5">{{ counts.done }} of {{ counts.all }} completed</p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">New Task</UButton>
    </div>

    <!-- Filter tabs -->
    <div class="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
        :class="statusFilter === opt.value
          ? 'bg-background shadow-sm text-foreground'
          : 'text-muted-foreground hover:text-foreground'"
        @click="statusFilter = opt.value"
      >
        {{ opt.label }}
        <span class="ml-1.5 text-xs opacity-60">{{ counts[opt.value as keyof typeof counts] }}</span>
      </button>
    </div>

    <!-- Task list -->
    <div class="space-y-2">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="bg-card rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-all"
        :class="priorityBorder(task.priority)"
      >
        <UCheckbox
          :model-value="task.status === 'done'"
          class="mt-0.5"
          @update:model-value="updateStatus(task, $event ? 'done' : 'todo')"
        />

        <div class="flex-1 min-w-0">
          <p
            class="font-medium leading-snug"
            :class="task.status === 'done' ? 'line-through text-muted-foreground' : ''"
          >
            {{ task.title }}
          </p>
          <p v-if="task.description" class="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {{ task.description }}
          </p>
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <UBadge :color="priorityColor(task.priority)" variant="soft" size="sm">
              {{ task.priority }}
            </UBadge>
            <UBadge :color="statusColor(task.status)" variant="soft" size="sm">
              {{ task.status.replace('_', ' ') }}
            </UBadge>
            <span v-if="task.dueDate" class="text-xs text-muted-foreground flex items-center gap-1">
              <UIcon name="i-lucide-calendar" class="text-xs" />
              {{ task.dueDate }}
            </span>
          </div>
        </div>

        <div class="flex gap-1 flex-shrink-0">
          <UButton icon="i-lucide-pencil" variant="ghost" size="sm" color="neutral" @click="openEdit(task)" />
          <UButton icon="i-lucide-trash-2" variant="ghost" size="sm" color="error" @click="confirmDelete(task)" />
        </div>
      </div>

      <div v-if="!filteredTasks.length" class="py-20 text-center text-muted-foreground">
        <UIcon name="i-lucide-inbox" class="text-5xl mb-3 opacity-40" />
        <p class="font-medium">No tasks here</p>
        <p class="text-sm mt-1 opacity-70">
          {{ statusFilter === 'all' ? 'Create your first task to get started.' : `No tasks with status "${statusFilter.replace('_', ' ')}".` }}
        </p>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <UModal v-model:open="showModal" :title="editingTask ? 'Edit Task' : 'New Task'">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="save">
          <UFormField label="Title" name="title" required>
            <UInput v-model="form.title" placeholder="What needs to be done?" class="w-full" autofocus />
          </UFormField>
          <UFormField label="Description" name="description">
            <UTextarea v-model="form.description" placeholder="Add details (optional)" class="w-full" :rows="3" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Priority" name="priority">
              <USelect
                v-model="form.priority"
                :items="[
                  { label: '🔴 High', value: 'high' },
                  { label: '🟡 Medium', value: 'medium' },
                  { label: '🟢 Low', value: 'low' },
                ]"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Due Date" name="dueDate">
              <AppDatePicker v-model="form.dueDate" placeholder="Pick due date" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <UButton variant="ghost" color="neutral" @click="showModal = false">Cancel</UButton>
            <UButton type="submit" :loading="loading">{{ editingTask ? 'Save changes' : 'Create task' }}</UButton>
          </div>
        </UForm>
      </template>
    </UModal>

  </div>
</template>
