<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  confirmColor?: string
  loading?: boolean
}>(), {
  title: 'Are you sure?',
  message: 'This action cannot be undone.',
  confirmLabel: 'Confirm',
  confirmColor: 'error',
  loading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-6 space-y-4">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
            <UIcon name="i-lucide-alert-triangle" class="text-error text-lg" />
          </div>
          <div>
            <h3 class="font-semibold text-base">{{ title }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ message }}</p>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <UButton variant="ghost" @click="emit('update:open', false)">Cancel</UButton>
          <UButton :color="confirmColor" :loading="loading" @click="emit('confirm')">
            {{ confirmLabel }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
