<script setup lang="ts">
import {MONTHS, addDays, mondayOf, pad, parseISO} from '~~/shared/utils/planDates'

const props = defineProps<{ year: number; marks?: string[] }>()
const marked = computed(() => new Set(props.marks ?? []))

interface WeekItem {
  key: string
  label: string
}
interface MonthGroup {
  month: string
  weeks: WeekItem[]
}

function shortDate(iso: string): string {
  return `${iso.slice(8)}.${iso.slice(5, 7)}`
}

function dateRange(start: string, end: string): string {
  const startYear = start.slice(0, 4)
  const endYear = end.slice(0, 4)
  if (startYear !== endYear) return `${shortDate(start)}.${startYear}–${shortDate(end)}.${endYear}`
  if (start.slice(5, 7) === end.slice(5, 7)) return `${start.slice(8)}–${shortDate(end)}.${endYear}`
  return `${shortDate(start)}–${shortDate(end)}.${endYear}`
}

// По ISO неделя принадлежит году своего четверга.
// Группа месяца — по понедельнику недели, как в утверждённом макете Figma.
// Неделя 1, начинающаяся в декабре предыдущего года, относится к январю выбранного года.
const groups = computed<MonthGroup[]>(() => {
  const start = mondayOf(`${props.year}-01-04`)
  const result: MonthGroup[] = []
  for (let key = start, index = 1; addDays(key, 3).slice(0, 4) === String(props.year); key = addDays(key, 7), index++) {
    const startDate = parseISO(key)
    const monthIndex = startDate.getUTCFullYear() === props.year ? startDate.getUTCMonth() : 0
    let group = result[result.length - 1]
    if (!group || group.month !== `${MONTHS[monthIndex]} ${props.year}`) {
      group = {month: `${MONTHS[monthIndex]} ${props.year}`, weeks: []}
      result.push(group)
    }
    group.weeks.push({
      key,
      label: `Неделя ${pad(index)}    ·    ${dateRange(key, addDays(key, 6))}`,
    })
  }
  return result
})
</script>

<template>
  <div>
    <p class="mb-2 text-sm text-toned">Недели {{ year }} года · переход к задачам выбранной недели</p>
    <div class="flex flex-col gap-1.5">
      <section v-for="group in groups" :key="group.month" class="flex flex-col gap-1.5">
        <div class="flex flex-col gap-[3px] pb-[7px] pt-[10px]">
          <h2 class="text-sm font-medium text-toned">{{ group.month }}</h2>
          <div class="h-px bg-[var(--ui-border-muted)]" aria-hidden="true"/>
        </div>
        <template v-for="week in group.weeks" :key="week.key">
          <PlanPeriodListItem
              type="week"
              :label="week.label"
              :to="`/plan/week/${week.key}`"
              :has-tasks="marked.has(week.key)"
          />
        </template>
      </section>
    </div>
  </div>
</template>
