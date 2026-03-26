<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useToast()
const { openConfirm } = useConfirm()
const { data: notes, refresh } = await useFetch('/api/notes')

const selectedNote = ref<any>(null)
const showCreateModal = ref(false)
const loading = ref(false)
const saving = ref(false)
const lastSaved = ref<Date | null>(null)
const lastSavedAgo = useTimeAgo(lastSaved as Ref<Date>)

// Mobile: show 'list' or 'editor' panel
const mobileView = ref<'list' | 'editor'>('list')

const form = reactive({ title: '', content: '', date: '' })
const today = new Date().toISOString().slice(0, 10)

function openCreate() {
  selectedNote.value = null
  Object.assign(form, { title: '', content: '', date: today })
  showCreateModal.value = true
}

function selectNote(note: any) {
  selectedNote.value = note
  Object.assign(form, { title: note.title, content: note.content ?? '', date: note.date })
  lastSaved.value = null
  mobileView.value = 'editor'
}

function backToList() {
  mobileView.value = 'list'
}

async function createNote() {
  loading.value = true
  try {
    const note = await $fetch('/api/notes', { method: 'POST', body: form })
    toast.add({ title: 'Note created', color: 'success' })
    showCreateModal.value = false
    await refresh()
    selectNote(note)
  }
  catch (err: any) {
    toast.add({ title: 'Error', description: err.data?.message, color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function saveNote() {
  if (!selectedNote.value) return
  saving.value = true
  try {
    await $fetch(`/api/notes/${selectedNote.value.id}`, { method: 'PATCH', body: form })
    lastSaved.value = new Date()
    await refresh()
  }
  catch {
    toast.add({ title: 'Failed to save', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

function confirmDelete(note: any) {
  openConfirm(
    'Delete note?',
    `'${note.title}' will be permanently deleted.`,
    async () => {
      await $fetch(`/api/notes/${note.id}`, { method: 'DELETE' })
      toast.add({ title: 'Note deleted', color: 'neutral' })
      if (selectedNote.value?.id === note.id) {
        selectedNote.value = null
        mobileView.value = 'list'
      }
      await refresh()
    },
  )
}

// useDebounceFn replaces manual setTimeout/clearTimeout
const debouncedSave = useDebounceFn(saveNote, 1200)
watch([() => form.content, () => form.title], () => {
  if (!selectedNote.value) return
  debouncedSave()
})

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
})

// useTimeAgo auto-updates the relative time string reactively
const savedLabel = computed(() => {
  if (saving.value) return 'Saving...'
  if (!lastSaved.value) return 'Auto-saved'
  return lastSavedAgo.value
})
</script>

<template>
  <div class="flex h-[calc(100vh-57px)] lg:h-screen overflow-hidden">

    <!-- Notes list panel -->
    <aside
      class="flex-shrink-0 border-r border-gray-200 bg-card flex flex-col"
      :class="[
        // Mobile: full width, hidden when editing
        'w-full lg:w-72',
        mobileView === 'editor' ? 'hidden lg:flex' : 'flex',
      ]"
    >
      <div class="px-4 py-3.5 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 class="font-bold">Notes</h1>
          <p class="text-xs text-muted-foreground">{{ notes?.length ?? 0 }} notes</p>
        </div>
        <UButton icon="i-lucide-square-pen" size="sm" @click="openCreate">
          <span class="hidden sm:inline ml-1">New</span>
        </UButton>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-0.5" style="scrollbar-width: none;">
        <button
          v-for="note in notes"
          :key="note.id"
          class="w-full text-left px-3 py-3 rounded-lg transition-colors group relative"
          :class="selectedNote?.id === note.id && mobileView === 'editor'
            ? 'bg-primary/10 ring-1 ring-primary/20'
            : 'hover:bg-muted'"
          @click="selectNote(note)"
        >
          <div class="flex items-start gap-2 pr-7">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ note.title }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ formatDate(note.date) }}</p>
              <p class="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {{ note.content || 'Empty note' }}
              </p>
            </div>
          </div>
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            size="xs"
            color="error"
            class="absolute top-2.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop="confirmDelete(note)"
          />
        </button>

        <div v-if="!notes?.length" class="py-16 text-center text-muted-foreground px-4">
          <UIcon name="i-lucide-notebook" class="text-4xl mb-3 opacity-40" />
          <p class="text-sm font-medium">No notes yet</p>
          <p class="text-xs mt-1 opacity-70">Create your first note.</p>
          <UButton size="sm" class="mt-3" @click="openCreate">Get started</UButton>
        </div>
      </div>
    </aside>

    <!-- Editor panel -->
    <main
      class="flex flex-col overflow-hidden bg-background"
      :class="[
        'flex-1',
        mobileView === 'list' ? 'hidden lg:flex' : 'flex',
      ]"
    >
      <template v-if="selectedNote">
        <!-- Editor header -->
        <div class="px-4 lg:px-8 py-3.5 border-b border-gray-200 flex items-center gap-3 bg-card/50 flex-shrink-0">
          <!-- Back button (mobile only) -->
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            size="sm"
            color="neutral"
            class="lg:hidden flex-shrink-0"
            @click="backToList"
          />
          <div class="flex-1 min-w-0">
            <input
              v-model="form.title"
              class="text-lg lg:text-xl font-bold bg-transparent border-none outline-none w-full truncate"
              placeholder="Note title..."
            />
            <p class="text-xs text-muted-foreground mt-0.5">{{ formatDate(form.date) }}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="hidden sm:flex text-xs text-muted-foreground items-center gap-1.5">
              <UIcon
                :name="saving ? 'i-lucide-loader-2' : 'i-lucide-check'"
                :class="[saving ? 'animate-spin' : 'text-success']"
              />
              {{ savedLabel }}
            </span>
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              @click="confirmDelete(selectedNote)"
            />
          </div>
        </div>

        <!-- Editor body -->
        <div class="flex-1 overflow-y-auto px-4 lg:px-8 py-5">
          <UTextarea
            v-model="form.content"
            placeholder="Start writing your thoughts..."
            class="w-full border-none bg-transparent text-base leading-7 resize-none focus:ring-0"
            :rows="20"
            autoresize
          />
        </div>
      </template>

      <!-- No note selected (desktop empty state) -->
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center text-muted-foreground max-w-xs px-4">
          <div class="w-16 h-16 rounded-2xl bg-info/10 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-notebook-pen" class="text-3xl text-info" />
          </div>
          <p class="font-semibold text-foreground">No note selected</p>
          <p class="text-sm mt-1">Choose a note from the list or create a new one.</p>
          <UButton class="mt-4" @click="openCreate">New Note</UButton>
        </div>
      </div>
    </main>

    <!-- Create Modal -->
    <UModal v-model:open="showCreateModal" title="New Note">
      <template #body>
        <UForm :state="form" class="space-y-4" @submit="createNote">
          <UFormField label="Title" name="title" required>
            <UInput v-model="form.title" placeholder="Note title" class="w-full" autofocus />
          </UFormField>
          <UFormField label="Date" name="date">
            <AppDatePicker v-model="form.date" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <UButton variant="ghost" color="neutral" @click="showCreateModal = false">Cancel</UButton>
            <UButton type="submit" :loading="loading">Create note</UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
