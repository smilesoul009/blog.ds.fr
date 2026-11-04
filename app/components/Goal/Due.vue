<script setup lang="ts">
import {todayISO} from '~~/shared/utils/planDates'
import {DUE_CLASS, dueLabel, dueState, timeLeft} from '~~/shared/utils/goals'

// Срок в строке списка: сколько осталось — «6 м. 3 д.», «сегодня», «просрочено 2 д.»; дата — в подсказке.
// Жёлтый — осталось 3 дня или меньше, красный — просрочен.
// Выполненное (и архив) — просто дата «до 25 окт»: «осталось» там уже не важно
const props = defineProps<{ date: string | null; finished?: boolean }>()
const state = computed(() => dueState(props.date, !!props.finished))

const label = computed(() => {
  if (!props.date) return ''
  if (props.finished) return dueLabel(props.date)
  const today = todayISO()
  if (props.date === today) return 'сегодня'
  if (props.date < today) return `просрочено ${timeLeft(props.date, today)}`
  return timeLeft(today, props.date)
})

const hint = computed(() => props.date && !props.finished ? `Срок ${dueLabel(props.date)}` : '')
</script>

<template>
  <span
      v-if="date"
      class="shrink-0 text-xs tabular-nums whitespace-nowrap"
      :class="DUE_CLASS[state]"
      :title="hint || undefined"
  >{{ label }}</span>
</template>
