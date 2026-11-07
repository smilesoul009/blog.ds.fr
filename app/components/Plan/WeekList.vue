<script setup lang="ts">
import {MONTHS, addDays, mondayOf, pad, parseISO, todayISO, weekDateRange} from '~~/shared/utils/planDates'

const props = withDefaults(defineProps<{ year: number; marks?: string[]; kind?: 'week' | 'weekly'; current?: string }>(), {
  kind: 'week',
})
const marked = computed(() => new Set(props.marks ?? []))

interface WeekItem {
  key: string
  label: string
}
interface MonthGroup {
  month: string
  weeks: WeekItem[]
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
      label: `${pad(index)} неделя    ·    ${weekDateRange(key, addDays(key, 6))}`,
    })
  }
  return result
})

// Page прокручивает внутренний контейнер, поэтому стандартный scrollBehavior роутера
// не восстанавливает положение списка при возврате из задач недели.
const root = ref<HTMLElement | null>(null)
let scroller: HTMLElement | null = null
// Сохраняем прежние ключи обычной недели, чтобы позиции пользователей не потерялись.
const positionKey = (year = props.year) => props.kind === 'weekly'
    ? `plan-weekly-list-scroll:${year}`
    : `plan-week-list-scroll:${year}`

function savePosition() {
  if (!scroller) return
  try {
    sessionStorage.setItem(positionKey(), String(scroller.scrollTop))
  } catch {
    // Хранилище может быть недоступно в приватном режиме.
  }
}

function restorePosition() {
  if (!root.value || !scroller) return

  let saved: string | null = null
  try {
    saved = sessionStorage.getItem(positionKey())
  } catch {
    // При недоступном хранилище используем текущую неделю.
  }
  if (saved !== null && saved.trim() !== '' && Number.isFinite(Number(saved)) && Number(saved) >= 0) {
    scroller.scrollTop = Number(saved)
    return
  }

  const currentWeek = mondayOf(todayISO())
  const item = [...root.value.querySelectorAll<HTMLElement>('[data-week-key]')]
      .find(row => row.dataset.weekKey === currentWeek)
  if (!item) {
    scroller.scrollTop = 0
    return
  }

  // Выравниваем текущую неделю по верху прокручиваемой области с небольшим отступом.
  scroller.scrollTop += item.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12
}

onMounted(async () => {
  await nextTick()
  scroller = root.value?.closest<HTMLElement>('.overflow-y-auto') ?? null
  restorePosition()
  scroller?.addEventListener('scroll', savePosition, {passive: true})
})

onBeforeUnmount(() => {
  savePosition()
  scroller?.removeEventListener('scroll', savePosition)
  scroller = null
})

watch(() => [props.year, props.kind] as const, async ([_year, newKind], [previousYear, previousKind]) => {
  // При смене года старую прокрутку сохраняем под ключом предыдущего года.
  if (!scroller) return
  try {
    sessionStorage.setItem(previousKind === 'weekly'
        ? `plan-weekly-list-scroll:${previousYear}`
        : `plan-week-list-scroll:${previousYear}`, String(scroller.scrollTop))
  } catch {}
  await nextTick()
  restorePosition()
})
</script>

<template>
  <div ref="root">
    <p class="mb-2 text-sm text-toned">Недели {{ year }} года · переход к {{ kind === 'weekly' ? 'еженедельному плану' : 'задачам выбранной недели' }}</p>
    <div class="flex flex-col gap-1.5">
      <section v-for="group in groups" :key="group.month" class="flex flex-col gap-1.5">
        <div class="flex flex-col gap-[3px] pb-[7px] pt-[10px]">
          <h2 class="text-sm font-medium text-toned">{{ group.month }}</h2>
          <div class="h-px bg-[var(--ui-border-muted)]" aria-hidden="true"/>
        </div>
        <div v-for="week in group.weeks" :key="week.key" :data-week-key="week.key">
          <PlanPeriodListItem
              type="week"
              :label="week.label"
              :to="`/plan/${kind}/${week.key}`"
              :has-tasks="marked.has(week.key)"
              :current="week.key === current"
              @click="savePosition"
          />
        </div>
      </section>
    </div>
  </div>
</template>
