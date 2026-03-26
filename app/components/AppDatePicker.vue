<script setup lang="ts">
import { CalendarDate, parseDate, today, getLocalTimeZone } from '@internationalized/date'

const props = withDefaults(defineProps<{
  modelValue?: string   // YYYY-MM-DD string
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: 'Pick a date',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)

// Convert YYYY-MM-DD string ↔ CalendarDate
const calendarValue = computed({
  get() {
    if (!props.modelValue) return undefined
    try { return parseDate(props.modelValue) }
    catch { return undefined }
  },
  set(val: CalendarDate | undefined) {
    emit('update:modelValue', val ? val.toString() : '')
    open.value = false
  },
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  try {
    return new Date(props.modelValue + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }
  catch { return props.modelValue }
})

function clearDate() {
  emit('update:modelValue', '')
  open.value = false
}
</script>

<template>
  <UPopover v-model:open="open" :disabled="disabled">
    <UButton
      variant="ghost"
      color="neutral"
      class="w-full justify-start font-normal px-2 h-8"
      :class="!modelValue ? 'text-muted-foreground/50' : 'text-muted-foreground'"
      :disabled="disabled"
    >
      <UIcon name="i-lucide-calendar" class="mr-1.5 shrink-0 text-sm" />
      <span class="flex-1 text-left truncate text-sm">{{ displayValue || placeholder }}</span>
      <UIcon
        v-if="modelValue"
        name="i-lucide-x"
        class="ml-1 shrink-0 opacity-40 hover:opacity-80 text-xs"
        @click.stop="clearDate"
      />
    </UButton>

    <template #content>
      <div class="p-3">
        <UCalendar
          v-model="calendarValue"
          :today-button="true"
          class="rounded-lg"
        />
      </div>
    </template>
  </UPopover>
</template>
