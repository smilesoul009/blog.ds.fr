<script setup lang="ts">
import {DAY_SLOT_ICON, DAY_SLOT_LABEL, DAY_SLOTS, type DaySlot} from '~~/shared/constants/notifications'

// Время дня для напоминаний: Утро / День / Вечер — квадратные значки, как ✓ ½ у задач (PlanStatusIcons).
// Подпись — в подсказке; times — часы слотов («Утро · 09:00»)
const model = defineModel<DaySlot>({required: true})
const props = defineProps<{ disabled?: boolean; times?: Record<DaySlot, string> }>()

const hint = (slot: DaySlot) => props.times ? `${DAY_SLOT_LABEL[slot]} · ${props.times[slot]}` : DAY_SLOT_LABEL[slot]

// Те же состояния, что у значков статуса задачи: выбранный — толстая рамка, остальные — тонкая
const stateClass = (slot: DaySlot) => model.value === slot
    ? 'ring-2 ring-gray-500 text-highlighted bg-white'
    : 'ring ring-accented text-muted bg-white hover:ring-inverted/60 hover:text-toned'
</script>

<template>
  <div class="flex gap-1 shrink-0" role="radiogroup" :class="disabled && 'opacity-50 pointer-events-none'">
    <button
        v-for="slot in DAY_SLOTS"
        :key="slot"
        type="button"
        role="radio"
        :aria-checked="model === slot"
        :aria-label="hint(slot)"
        :title="hint(slot)"
        :disabled="disabled"
        class="size-8 rounded-xs ring-inset flex items-center justify-center transition"
        :class="stateClass(slot)"
        @click="model = slot"
    >
      <UIcon :name="DAY_SLOT_ICON[slot]" class="size-4"/>
    </button>
  </div>
</template>
