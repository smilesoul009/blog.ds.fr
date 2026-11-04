<script setup lang="ts">
import type {PlanStatus} from '~~/shared/types/plan'

const props = withDefaults(defineProps<{ status: PlanStatus; size?: 'sm' | 'md' }>(), {size: 'md'})
const emit = defineEmits<{ set: [status: PlanStatus] }>()

const box = computed(() => props.size === 'md' ? 'size-8 text-sm' : 'size-5 text-[11px]')
const icon = computed(() => props.size === 'md' ? 'size-4' : 'size-3')
const thick = computed(() => props.size === 'md' ? 'ring-2' : 'ring-[1.5px]')

// Два значка всегда, активный выделен.
// У выполненной задачи (бледная строка) оба приглушены, активный — чуть заметнее
function stateClass(s: PlanStatus) {
  const active = props.status === s

  if (props.status !== 'TODO') {
    return active
        ? `${thick.value} ring-gray-500 text-toned bg-white`
        : 'ring ring-default text-dimmed bg-transparent hover:ring-accented hover:text-toned'
  }

  return active
      ? `${thick.value} ring-gray-500 text-highlighted bg-white`
      : 'ring ring-accented text-muted bg-white hover:ring-inverted/60 hover:text-toned'
}
</script>

<template>
  <div class="flex gap-1 shrink-0">
    <button
        type="button"
        :title="status === 'DONE' ? 'Снять отметку «Выполнено»' : 'Выполнено'"
        :aria-pressed="status === 'DONE'"
        class="rounded-xs ring-inset flex items-center justify-center transition"
        :class="[box, stateClass('DONE')]"
        @click.stop="emit('set', 'DONE')"
        @keydown.enter.stop
    >
      <UIcon name="i-lucide-check" :class="icon"/>
    </button>
    <button
        type="button"
        :title="status === 'PARTIAL' ? 'Снять отметку «Частично»' : 'Частично'"
        :aria-pressed="status === 'PARTIAL'"
        class="rounded-xs ring-inset flex items-center justify-center leading-none transition"
        :class="[box, stateClass('PARTIAL')]"
        @click.stop="emit('set', 'PARTIAL')"
        @keydown.enter.stop
    >
      ½
    </button>
  </div>
</template>