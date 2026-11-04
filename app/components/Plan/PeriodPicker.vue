<script setup lang="ts">
import {
  MONTHS_SHORT, YEAR_SPAN, pad, periodKeyFor, periodStartISO, spanStartYear, todayISO, type PlanScopeKey,
} from '~~/shared/utils/planDates'

const props = defineProps<{ scope: PlanScopeKey; period: string }>()
const emit = defineEmits<{ select: [key: string] }>()

const selectedISO = computed(() => periodStartISO(props.scope, props.period))
const selectedYear = Number(props.period.slice(0, 4))
const today = todayISO()

// Месяц: листаем годы
const year = ref(selectedYear)

// Год: сетка из 12 лет
const yearsFrom = ref(selectedYear - 4)
const years = computed(() => Array.from({length: 12}, (_, i) => yearsFrom.value + i))

// 2 и 3 года: сетка из 12 периодов
const span = computed(() => (props.scope === 'year2' || props.scope === 'year3') ? YEAR_SPAN[props.scope] : 1)
const spansFrom = ref(spanStartYear(selectedYear, span.value) - 4 * span.value)
const spans = computed(() => Array.from({length: 12}, (_, i) => {
  const start = spansFrom.value + i * span.value
  return {key: `${start}-${start + span.value - 1}`, label: `${start}–${start + span.value - 1}`}
}))
const todaySpanKey = computed(() => span.value > 1 ? periodKeyFor(props.scope, today) : '')
</script>

<template>
  <div class="p-3">
    <PlanMiniCalendar
        v-if="scope === 'day' || scope === 'week'"
        :selected="selectedISO"
        :mode="scope"
        @select="(iso: string) => emit('select', periodKeyFor(scope, iso))"
    />

    <div v-else-if="scope === 'month'" class="w-64">
      <div class="flex items-center justify-between mb-2">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="sm" @click="year--"/>
        <span class="font-medium">{{ year }}</span>
        <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="sm" @click="year++"/>
      </div>
      <div class="grid grid-cols-3 gap-1">
        <button
            v-for="(name, i) in MONTHS_SHORT"
            :key="i"
            type="button"
            class="h-9 rounded-xs text-sm hover:bg-elevated"
            :class="[
              `${year}-${pad(i + 1)}` === period && 'ring-2 ring-inset ring-gray-500',
              `${year}-${pad(i + 1)}` === today.slice(0, 7) && 'ring ring-inset ring-accented',
            ]"
            @click="emit('select', `${year}-${pad(i + 1)}`)"
        >
          {{ name }}
        </button>
      </div>
    </div>

    <div v-else-if="scope === 'year2' || scope === 'year3'" class="w-72">
      <div class="flex items-center justify-between mb-2">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="sm" @click="spansFrom -= 12 * span"/>
        <span class="font-medium">{{ spansFrom }} – {{ spansFrom + 12 * span - 1 }}</span>
        <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="sm" @click="spansFrom += 12 * span"/>
      </div>
      <div class="grid grid-cols-3 gap-1">
        <button
            v-for="p in spans"
            :key="p.key"
            type="button"
            class="h-9 rounded-xs text-sm tabular-nums hover:bg-elevated"
            :class="[
              p.key === period && 'ring-2 ring-inset ring-gray-500',
              p.key === todaySpanKey && 'ring ring-inset ring-accented',
            ]"
            @click="emit('select', p.key)"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div v-else class="w-64">
      <div class="flex items-center justify-between mb-2">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="sm" @click="yearsFrom -= 12"/>
        <span class="font-medium">{{ years[0] }} – {{ years[11] }}</span>
        <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="sm" @click="yearsFrom += 12"/>
      </div>
      <div class="grid grid-cols-3 gap-1">
        <button
            v-for="y in years"
            :key="y"
            type="button"
            class="h-9 rounded-xs text-sm hover:bg-elevated"
            :class="[
              String(y) === period && 'ring-2 ring-inset ring-gray-500',
              String(y) === today.slice(0, 4) && 'ring ring-inset ring-accented',
            ]"
            @click="emit('select', String(y))"
        >
          {{ y }}
        </button>
      </div>
    </div>
  </div>
</template>