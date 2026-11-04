<script setup lang="ts">
import {
  MONTHS, WEEKDAYS_SHORT, addDays, mondayOf, parseISO, toISO, todayISO,
} from '~~/shared/utils/planDates'

const props = defineProps<{ selected: string; mode: 'day' | 'week' }>()
const emit = defineEmits<{ select: [iso: string] }>()

const view = ref(props.selected.slice(0, 7))
const today = todayISO()
const hoverWeek = ref<string | null>(null)
const selectedWeek = computed(() => props.mode === 'week' ? mondayOf(props.selected) : null)

const title = computed(() => {
  const [y, m] = view.value.split('-').map(Number)
  return `${MONTHS[m! - 1]} ${y}`
})

const weeks = computed(() => {
  const start = mondayOf(`${view.value}-01`)
  return Array.from({length: 6}, (_, w) =>
      Array.from({length: 7}, (_, d) => addDays(start, w * 7 + d)))
})

function shift(delta: number) {
  const d = parseISO(`${view.value}-01`)
  d.setUTCMonth(d.getUTCMonth() + delta)
  view.value = toISO(d).slice(0, 7)
}

// Выбранный период — рамка без заливки, как у отметок «Выполнено / Частично»; сегодня — тонкая светлая рамка
const SELECTED = 'ring-2 ring-inset ring-gray-500'

function dayClass(iso: string) {
  const selected = props.mode === 'day' && iso === props.selected
  return [
    iso.slice(0, 7) !== view.value && 'text-dimmed',
    selected ? SELECTED : iso === today && 'ring ring-inset ring-accented',
    props.mode === 'day' && 'hover:bg-elevated',
  ]
}

function weekClass(week: string[]) {
  if (props.mode !== 'week') return ''
  return [
    week[0] === selectedWeek.value && SELECTED,
    week[0] === hoverWeek.value && 'bg-elevated',
  ]
}
</script>

<template>
  <div class="w-72 select-none">
    <div class="flex items-center justify-between mb-2">
      <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="sm" @click="shift(-1)"/>
      <span class="font-medium">{{ title }}</span>
      <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="sm" @click="shift(1)"/>
    </div>

    <div class="grid grid-cols-7 text-xs text-dimmed mb-1">
      <span v-for="d in WEEKDAYS_SHORT" :key="d" class="text-center">{{ d }}</span>
    </div>

    <div
        v-for="week in weeks"
        :key="week[0]"
        class="grid grid-cols-7 rounded-xs"
        :class="weekClass(week)"
        @mouseenter="hoverWeek = week[0]!"
        @mouseleave="hoverWeek = null"
    >
      <button
          v-for="iso in week"
          :key="iso"
          type="button"
          class="h-9 rounded-xs text-sm tabular-nums"
          :class="dayClass(iso)"
          @click="emit('select', iso)"
      >
        {{ Number(iso.slice(8)) }}
      </button>
    </div>
  </div>
</template>