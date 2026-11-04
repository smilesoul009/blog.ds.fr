<script setup lang="ts">
import {MONTHS, WEEKDAYS_SHORT, addDays, mondayOf, pad, parseISO} from '~~/shared/utils/planDates'

// Календарь года: 12 месяцев (4 × 3) с днями, номер недели слева мелко и серым.
// Пустые клетки первой и последней недели месяца заполнены бледными днями соседних месяцев.
// mode — что выбирается: day (дата), week (строка недели; неделя на стыке месяцев подсвечивается в обоих),
// month (месяц целиком). Ключи: день — 2026-10-29, неделя — её понедельник, месяц — 2026-10.
// marks — периоды, где есть задачи (точка «•»); current — текущий период (нежирная рамка).
// Неделя принадлежит году своего четверга — как её номер по ISO (неделя 29 дек – 4 янв — первая неделя нового года).
// Строки недель чужого года — бледные (в режиме недели), но выбрать их можно.
// С клавиатуры: Tab — к календарю, стрелки — соседний день / неделя / месяц, Enter — выбрать
const props = defineProps<{
  year: number
  mode: 'day' | 'week' | 'month'
  marks?: string[]
  current?: string
}>()
const emit = defineEmits<{ select: [key: string] }>()

const marked = computed(() => new Set(props.marks ?? []))
const hover = ref<string | null>(null)

// out — день соседнего месяца (бледный, только подпись: выбирается в своём месяце)
interface Cell { iso: string; out: boolean }
interface Row { key: string; num: number; days: Cell[]; foreign: boolean }
interface Month { key: string; name: string; rows: Row[] }

// Номер недели по ISO (неделя с четвергом этого года)
function isoWeek(monday: string): number {
  const thu = parseISO(addDays(monday, 3))
  const jan1 = Date.UTC(thu.getUTCFullYear(), 0, 1)
  return Math.floor((thu.getTime() - jan1) / 86_400_000 / 7) + 1
}

const months = computed<Month[]>(() => Array.from({length: 12}, (_, m) => {
  const key = `${props.year}-${pad(m + 1)}`
  const first = `${key}-01`
  const rows: Row[] = []
  for (let mon = mondayOf(first); mon.slice(0, 7) <= key; mon = addDays(mon, 7)) {
    const days = Array.from({length: 7}, (_, i) => {
      const iso = addDays(mon, i)
      return {iso, out: iso.slice(0, 7) !== key}
    })
    rows.push({key: mon, num: isoWeek(mon), days, foreign: Number(addDays(mon, 3).slice(0, 4)) !== props.year})
  }
  return {key, name: MONTHS[m]!, rows}
}))

const dayNum = (iso: string) => Number(iso.slice(8))

// ── клавиатура: стрелки переводят фокус на соседний период ──
const root = ref<HTMLElement | null>(null)

function step(key: string, dir: 'left' | 'right' | 'up' | 'down'): string {
  const sign = dir === 'left' || dir === 'up' ? -1 : 1
  if (props.mode === 'day') return addDays(key, sign * (dir === 'up' || dir === 'down' ? 7 : 1))
  if (props.mode === 'week') return addDays(key, sign * 7)
  const [y, m] = key.split('-').map(Number)
  const idx = y! * 12 + (m! - 1) + sign * (dir === 'up' || dir === 'down' ? 4 : 1)
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`
}

function onKey(e: KeyboardEvent) {
  const dirs: Record<string, 'left' | 'right' | 'up' | 'down'> = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  }
  const dir = dirs[e.key]
  const key = (e.target as HTMLElement).dataset.key
  if (!dir || !key) return
  e.preventDefault()
  const next = root.value?.querySelector<HTMLElement>(`[data-key="${step(key, dir)}"]`)
  next?.focus()
}

// Наведение — светло-серый фон, как у кнопок панели редактора; выбор (нажатие, фокус с клавиатуры) — рамка
// без смены цвета, как у отметок «Выполнено / Частично»
const UNIT = 'outline-none focus-visible:ring-2 focus-visible:ring-gray-500 active:ring-2 active:ring-gray-500'
const HOVER = 'bg-elevated'        // у дня — тот же цвет, классом hover:bg-elevated
</script>

<template>
  <!-- Разметка одна во всех режимах (те же отступы и высоты строк): при переходе Месяц / Неделя / День
       календарь не сдвигается — меняется только то, что подсвечивается -->
  <div
      ref="root"
      class="grid grid-cols-4 gap-3 select-none"
      @keydown="onKey"
      @mouseleave="hover = null"
  >
    <component
        :is="mode === 'month' ? 'button' : 'div'"
        v-for="mo in months"
        :key="mo.key"
        :type="mode === 'month' ? 'button' : undefined"
        :data-key="mode === 'month' ? mo.key : undefined"
        class="flex flex-col justify-start w-full rounded-xs ring-inset p-2 text-left transition-colors"
        :class="[
          mode === 'month' && `cursor-pointer ${UNIT}`,
          mode === 'month' && hover === mo.key ? HOVER : 'bg-white/70',
          mode === 'month' && current === mo.key ? 'ring ring-accented' : 'ring ring-default',
        ]"
        @mouseenter="mode === 'month' && (hover = mo.key)"
        @click="mode === 'month' && emit('select', mo.key)"
    >
      <!-- Точка «•» — абсолютно, чтобы название не сдвигалось -->
      <div class="relative text-sm font-medium leading-5 mb-1 px-0.5">
        {{ mo.name }}
        <span v-if="mode === 'month' && marked.has(mo.key)" class="absolute ms-1 text-toned">•</span>
      </div>

      <!-- Дни недели -->
      <div class="grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))] text-[10px] leading-4 text-dimmed">
        <span/>
        <span v-for="d in WEEKDAYS_SHORT" :key="d" class="text-center">{{ d }}</span>
      </div>

      <!-- Недели: строка — своя сетка, чтобы подсвечивать неделю целиком -->
      <div class="flex flex-col gap-0.5">
        <component
            :is="mode === 'week' ? 'button' : 'div'"
            v-for="row in mo.rows"
            :key="row.key"
            :type="mode === 'week' ? 'button' : undefined"
            :data-key="mode === 'week' ? row.key : undefined"
            class="grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))] w-full h-7 rounded-xs ring-inset text-xs text-left"
            :class="[
              mode === 'week' && `cursor-pointer ${UNIT}`,
              mode === 'week' && (hover === row.key ? HOVER : 'bg-elevated/40'),
              mode === 'week' && current === row.key && 'ring ring-accented',
              mode === 'week' && row.foreign && hover !== row.key && 'opacity-50',
            ]"
            :title="mode === 'week' ? `Неделя ${row.num}${row.foreign ? ` (${addDays(row.key, 3).slice(0, 4)} год)` : ''}` : undefined"
            @mouseenter="mode === 'week' && (hover = row.key)"
            @click="mode === 'week' && emit('select', row.key)"
        >
          <!-- Номер недели -->
          <span class="relative text-[10px] tabular-nums text-right pe-1.5 leading-7 text-dimmed">
            {{ row.num }}
            <span
                v-if="mode === 'week' && marked.has(row.key)"
                class="absolute left-0.5 top-1/2 -translate-y-1/2 size-1 rounded-full bg-current"
            />
          </span>

          <template v-for="{iso, out} in row.days" :key="iso">
            <!-- Дни прошлого и следующего месяца — бледные, не выбираются и не подсвечиваются -->
            <span v-if="out" class="h-7 leading-7 text-center tabular-nums text-dimmed">{{ dayNum(iso) }}</span>
            <button
                v-else-if="mode === 'day'"
                type="button"
                :data-key="iso"
                class="relative h-7 leading-7 rounded-xs ring-inset text-center tabular-nums"
                :class="[UNIT, 'hover:bg-elevated', current === iso && 'ring ring-accented']"
                :title="iso"
                @click="emit('select', iso)"
            >
              {{ dayNum(iso) }}
              <span
                  v-if="marked.has(iso)"
                  class="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-current opacity-70"
              />
            </button>
            <span v-else class="h-7 leading-7 text-center tabular-nums">{{ dayNum(iso) }}</span>
          </template>
        </component>
      </div>
    </component>
  </div>
</template>
