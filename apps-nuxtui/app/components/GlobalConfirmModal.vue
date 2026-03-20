<script setup lang="ts">
import { useConfirmStore } from '~/stores/confirm'

const store = useConfirmStore()
</script>

<template>
  <UModal :open="store.open" @update:open="store.close">
    <template #content>
      <div class="p-6 space-y-4">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
            <UIcon name="i-lucide-alert-triangle" class="text-error text-lg" />
          </div>
          <div>
            <h3 class="font-semibold text-base">{{ store.title }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ store.message }}</p>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <UButton variant="ghost" color="neutral" :disabled="store.loading" @click="store.close">
            Cancel
          </UButton>
          <UButton :color="store.confirmColor" :loading="store.loading" @click="store.confirm">
            {{ store.confirmLabel }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
