<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: 'Pick date & time',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const selectedDate = ref<CalendarDate | undefined>()
const hour = ref(9)
const minute = ref(0)
const period = ref<'AM' | 'PM'>('AM')

// Track direction for slide animation
const hourDir = ref(1)   // 1 = up, -1 = down
const minuteDir = ref(1)

watch(() => props.modelValue, (val) => {
  if (!val) { selectedDate.value = undefined; return }
  const d = new Date(val)
  selectedDate.value = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
  const h = d.getHours()
  minute.value = d.getMinutes()
  if (h === 0) { hour.value = 12; period.value = 'AM' }
  else if (h < 12) { hour.value = h; period.value = 'AM' }
  else if (h === 12) { hour.value = 12; period.value = 'PM' }
  else { hour.value = h - 12; period.value = 'PM' }
}, { immediate: true })

function emitValue() {
  if (!selectedDate.value) return
  let h24 = hour.value
  if (period.value === 'AM' && h24 === 12) h24 = 0
  else if (period.value === 'PM' && h24 !== 12) h24 += 12
  const d = new Date(selectedDate.value.year, selectedDate.value.month - 1, selectedDate.value.day, h24, minute.value, 0)
  emit('update:modelValue', d.toISOString())
}

function onDatePick(val: CalendarDate | undefined) {
  selectedDate.value = val
  if (val) emitValue()
}

watch([hour, minute, period], () => { if (selectedDate.value) emitValue() })

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  try {
    return new Date(props.modelValue).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }
  catch { return '' }
})

function clear() {
  selectedDate.value = undefined
  emit('update:modelValue', '')
  open.value = false
}

function adjustHour(delta: number) {
  hourDir.value = delta
  hour.value = ((hour.value - 1 + delta + 12) % 12) + 1
}

function adjustMinute(delta: number) {
  minuteDir.value = delta
  minute.value = (minute.value + delta + 60) % 60
}

const displayMinute = computed(() => String(minute.value).padStart(2, '0'))
const displayHour = computed(() => String(hour.value).padStart(2, '0'))
</script>

<template>
  <UPopover v-model:open="open" :disabled="disabled" :content="{ side: 'bottom', align: 'start', sideOffset: 6, collisionPadding: 12 }">
    <UButton
      variant="ghost"
      color="neutral"
      class="w-full justify-start font-normal px-2 h-8"
      :class="!modelValue ? 'text-muted-foreground/50' : 'text-muted-foreground'"
      :disabled="disabled"
    >
      <UIcon name="i-lucide-bell" class="mr-1.5 shrink-0 text-sm text-primary" />
      <span class="flex-1 text-left truncate text-sm">{{ displayValue || placeholder }}</span>
      <UIcon
        v-if="modelValue"
        name="i-lucide-x"
        class="ml-1 shrink-0 opacity-40 hover:opacity-80 text-xs"
        @click.stop="clear"
      />
    </UButton>

    <template #content>
      <div class="flex divide-x divide-gray-100 dark:divide-gray-800">

        <!-- Left: Calendar -->
        <div class="p-3">
          <UCalendar
            :model-value="selectedDate"
            class="rounded-lg"
            @update:model-value="onDatePick"
          />
        </div>

        <!-- Right: Time + Done -->
        <div class="p-3 flex flex-col justify-between min-w-30">
          <div>
            <p class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Time</p>

            <!-- Hour : Minute -->
            <div class="flex items-center justify-center gap-1.5 mb-4">
              <!-- Hour -->
              <div class="flex flex-col items-center gap-1">
                <UButton icon="i-lucide-chevron-up" variant="ghost" color="neutral" size="xs" @click="adjustHour(1)" />
                <div class="w-9 h-7 overflow-hidden relative">
                  <Transition :name="hourDir > 0 ? 'tick-up' : 'tick-down'" mode="out-in">
                    <span
                      :key="displayHour"
                      class="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums"
                    >{{ displayHour }}</span>
                  </Transition>
                </div>
                <UButton icon="i-lucide-chevron-down" variant="ghost" color="neutral" size="xs" @click="adjustHour(-1)" />
              </div>

              <span class="text-lg font-bold text-muted-foreground pb-0.5">:</span>

              <!-- Minute -->
              <div class="flex flex-col items-center gap-1">
                <UButton icon="i-lucide-chevron-up" variant="ghost" color="neutral" size="xs" @click="adjustMinute(5)" />
                <div class="w-9 h-7 overflow-hidden relative">
                  <Transition :name="minuteDir > 0 ? 'tick-up' : 'tick-down'" mode="out-in">
                    <span
                      :key="displayMinute"
                      class="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums"
                    >{{ displayMinute }}</span>
                  </Transition>
                </div>
                <UButton icon="i-lucide-chevron-down" variant="ghost" color="neutral" size="xs" @click="adjustMinute(-5)" />
              </div>
            </div>

            <!-- AM / PM -->
            <div class="flex flex-col gap-1.5">
              <button
                class="w-full py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
                :class="period === 'AM'
                  ? 'bg-primary text-white scale-105 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 scale-100'"
                @click="period = 'AM'"
              >AM</button>
              <button
                class="w-full py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
                :class="period === 'PM'
                  ? 'bg-primary text-white scale-105 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 scale-100'"
                @click="period = 'PM'"
              >PM</button>
            </div>
          </div>

          <!-- Done -->
          <UButton
            class="w-full justify-center mt-4"
            size="sm"
            :disabled="!selectedDate"
            @click="open = false"
          >
            Done
          </UButton>
        </div>

      </div>
    </template>
  </UPopover>
</template>

<style scoped>
/* Scroll up (increment): new slides in from bottom, old exits to top */
.tick-up-enter-from { transform: translateY(60%); opacity: 0; }
.tick-up-enter-active { transition: transform 0.18s ease, opacity 0.18s ease; }
.tick-up-leave-to { transform: translateY(-60%); opacity: 0; }
.tick-up-leave-active { transition: transform 0.18s ease, opacity 0.18s ease; }

/* Scroll down (decrement): new slides in from top, old exits to bottom */
.tick-down-enter-from { transform: translateY(-60%); opacity: 0; }
.tick-down-enter-active { transition: transform 0.18s ease, opacity 0.18s ease; }
.tick-down-leave-to { transform: translateY(60%); opacity: 0; }
.tick-down-leave-active { transition: transform 0.18s ease, opacity 0.18s ease; }
</style>
