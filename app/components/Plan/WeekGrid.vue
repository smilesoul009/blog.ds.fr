<script setup lang="ts">
import {WEEKDAYS_SHORT, addDays, minToTime, pad, todayISO} from '~~/shared/utils/planDates'
import {
  NO_ROOM_MESSAGE, PLAN_SLOT_MIN, PLAN_SLOT_PX, PLAN_SLOTS, layoutDay, placeInSlot, slotMin, type DaySlots,
} from '~~/shared/utils/planWeek'
import type {PlanAction, PlanTaskItem} from '~~/shared/types/plan'

// Сетка плана недели (2.0). У задачи только время начала; ячейка — PLAN_SLOT_MIN минут, в ячейке одна задача.
// Карточка — сплошной блок на 30 минут (две строки: «время название»); если через 15 минут следующая задача —
// сжимается до 15 минут (одна строка). Значков нет: выполненная — бледная, частично — бледная левая половина.
// ⋮ — при наведении на правый верхний угол. Наведение на пустое место — линия с временем, клик — новая задача.
// Клик по карточке — правка названия прямо в карточке (окна нет — взгляд остаётся на месте). Перетаскивание меняет день и время, с Ctrl — копия: задача в занятой ячейке
// и следующие за ней сдвигаются до первой свободной (видно сразу). Не помещающееся название раскрывается при наведении
const props = defineProps<{ period: string; tasks: PlanTaskItem[]; pending?: boolean; busy?: boolean }>()
const emit = defineEmits<{
  rename: [task: PlanTaskItem, title: string]
  create: [day: string, startMin: number, title: string]
  action: [task: PlanTaskItem, action: PlanAction]
  place: [task: PlanTaskItem, day: string, startMin: number, copy: boolean]
}>()

const SLOT = PLAN_SLOT_PX
const HOUR = (60 / PLAN_SLOT_MIN) * SLOT
const EXPAND_DELAY = 400

const toast = useToast()

const days = computed(() => Array.from({length: 7}, (_, i) => addDays(props.period, i)))
const byId = computed(() => new Map(props.tasks.map(t => [t.id, t])))

// «Сейчас» — только в браузере
const today = ref('')
const nowMin = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

function tick() {
  const d = new Date()
  today.value = todayISO()
  nowMin.value = d.getHours() * 60 + d.getMinutes()
}

// ── Раскладка по данным: каждой задаче — своя ячейка ──
const layout = computed(() =>
    new Map(days.value.map(day => [day, layoutDay(props.tasks.filter(t => t.day === day))])))

const clampSlot = (s: number) => Math.min(PLAN_SLOTS - 1, Math.max(0, s))

function isTaken(day: string, slot: number) {
  for (const s of layout.value.get(day)?.values() ?? []) if (s === slot) return true
  return false
}

// ── Перетаскивание ──
interface Drag {
  task: PlanTaskItem
  fromDay: string
  fromSlot: number
  x0: number
  y0: number
  grabY: number       // где схватили карточку — от её верха
  active: boolean     // сдвинули мышь больше чем на 4 px; иначе это клик
  copy: boolean       // зажат Ctrl — копия, исходная задача остаётся на месте
  day: string
  slot: number
}

const COPY_ID = '__copy__'
const movingId = (t: { task: PlanTaskItem; copy: boolean }) => (t.copy ? COPY_ID : t.task.id)

const drag = ref<Drag | null>(null)
// После отпускания новая раскладка держится, пока не придут данные с сервера (без «прыжка» назад)
const held = ref<{ task: PlanTaskItem; day: string; slot: number; copy: boolean } | null>(null)
watch(() => props.tasks, () => (held.value = null))

const target = computed(() => (drag.value?.active ? drag.value : held.value))

// Раскладка дня, куда тянем; null — до конца дня места не хватает
const targetSlots = computed<DaySlots | null>(() => {
  const t = target.value
  if (!t) return null
  return placeInSlot(layout.value.get(t.day) ?? new Map(), movingId(t), t.slot)
})
const noRoom = computed(() => !!drag.value?.active && !targetSlots.value)

interface Card {
  key: string
  task: PlanTaskItem
  slot: number
  span: 1 | 2         // высота в ячейках: 2 (30 минут), 1 — если следующая ячейка занята
  dragged: boolean
}

const columns = computed<Card[][]>(() => days.value.map((day) => {
  const t = target.value
  const moving = t ? movingId(t) : null
  let slots: DaySlots = layout.value.get(day) ?? new Map()
  if (t && day === t.day) {
    if (targetSlots.value) slots = targetSlots.value
    else {
      slots = new Map(slots)
      if (!t.copy) slots.delete(t.task.id)
      slots.set(moving!, t.slot)
    }
  } else if (t && !t.copy && slots.has(t.task.id)) {
    slots = new Map(slots)
    slots.delete(t.task.id)
  }
  const n = newCard.value
  if (n && n.day === day && !t) {
    slots = new Map(slots)
    slots.set(NEW_ID, n.slot)
  }
  const taken = new Set(slots.values())
  const out: Card[] = []
  for (const [id, slot] of slots) {
    const task = id === moving ? t!.task : id === NEW_ID ? newTask(n!) : byId.value.get(id)
    if (!task) continue
    const span = slot + 1 < PLAN_SLOTS && !taken.has(slot + 1) ? 2 : 1
    out.push({key: id, task, slot, span, dragged: !!drag.value?.active && id === moving})
  }
  return out
}))

const colEls = new Map<string, HTMLElement>()

function setCol(day: string, el: unknown) {
  if (el) colEls.set(day, el as HTMLElement)
  else colEls.delete(day)
}

function onCardDown(e: PointerEvent, card: Card, day: string) {
  if (e.button !== 0 || props.busy || isEditing(card) || card.key === NEW_ID) return
  const el = e.currentTarget as HTMLElement
  drag.value = {
    task: card.task, fromDay: day, fromSlot: card.slot,
    x0: e.clientX, y0: e.clientY, grabY: e.clientY - el.getBoundingClientRect().top,
    active: false, copy: false, day, slot: card.slot,
  }
}

function onPointerMove(e: PointerEvent) {
  const d = drag.value
  if (!d) return
  if (!d.active) {
    if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 4) return
    d.active = true
    collapse()
  }
  e.preventDefault()
  d.copy = e.ctrlKey || e.metaKey
  for (const [day, el] of colEls) {
    const r = el.getBoundingClientRect()
    if (e.clientX >= r.left && e.clientX < r.right) {
      d.day = day
      d.slot = clampSlot(Math.round((e.clientY - d.grabY - r.top) / SLOT))
      break
    }
  }
  autoScroll(e.clientY)
}

let droppedAt = 0

function onPointerUp() {
  const d = drag.value
  drag.value = null
  if (!d) return
  if (!d.active) return startEdit(d.task.id)

  droppedAt = Date.now()
  if (!d.copy && d.day === d.fromDay && d.slot === d.fromSlot) return
  if (!placeInSlot(layout.value.get(d.day) ?? new Map(), movingId(d), d.slot)) {
    toast.add({title: NO_ROOM_MESSAGE, color: 'warning'})
    return
  }
  held.value = {task: d.task, day: d.day, slot: d.slot, copy: d.copy}
  emit('place', d.task, d.day, slotMin(d.slot), d.copy)
}

function onKeydown(e: KeyboardEvent) {
  if (!drag.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    drag.value = null
  } else if (e.key === 'Control' || e.key === 'Meta') {
    drag.value.copy = true
  }
}

// Ctrl можно нажать и отпустить прямо во время перетаскивания
function onKeyup(e: KeyboardEvent) {
  if (drag.value && (e.key === 'Control' || e.key === 'Meta')) drag.value.copy = false
}

const win = import.meta.client ? window : undefined
useEventListener(win, 'pointermove', onPointerMove)
useEventListener(win, 'pointerup', onPointerUp)
useEventListener(win, 'pointercancel', () => (drag.value = null))
useEventListener(win, 'keydown', onKeydown)
useEventListener(win, 'keyup', onKeyup)

// Прокрутка, когда тянем к краю
function autoScroll(y: number) {
  const sp = scrollParent(gridEl.value)
  if (!sp) return
  const r = sp.getBoundingClientRect()
  const top = r.top + (headerEl.value?.offsetHeight ?? 0)
  if (y < top + 40) sp.scrollBy({top: -12})
  else if (y > r.bottom - 40) sp.scrollBy({top: 12})
}

// ── Наведение на пустое место: ячейка и линия с временем; клик — новая задача ──
const hover = ref<{ day: string; slot: number } | null>(null)
const overCard = ref(false)

function slotAt(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  return clampSlot(Math.floor((e.clientY - r.top) / SLOT))
}

function onColumnMove(e: MouseEvent, day: string) {
  if (drag.value) return
  const slot = slotAt(e)
  if (hover.value?.day !== day || hover.value?.slot !== slot) hover.value = {day, slot}
}

function onColumnClick(e: MouseEvent, day: string) {
  if (props.busy || Date.now() - droppedAt < 300 || Date.now() - editEndedAt < 300) return
  const slot = slotAt(e)
  if (isTaken(day, slot)) return
  startNew(day, slot)
}

const showLine = (day: string) =>
    !!hover.value && hover.value.day === day && !overCard.value && !drag.value && !isTaken(day, hover.value.slot)

// ── Раскрытие названия при наведении (только если не помещается) ──
const expanded = ref<string | null>(null)
let expandTimer: ReturnType<typeof setTimeout> | undefined

function onCardEnter(e: MouseEvent, card: Card) {
  overCard.value = true
  clearTimeout(expandTimer)
  if (drag.value || isEditing(card)) return
  const title = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-title]')
  expandTimer = setTimeout(() => {
    const clipped = !!title && (title.scrollHeight > title.clientHeight + 1 || title.scrollWidth > title.clientWidth)
    if (!drag.value && clipped) expanded.value = card.task.id
  }, EXPAND_DELAY)
}

function collapse() {
  clearTimeout(expandTimer)
  expanded.value = null
}

function onCardLeave() {
  overCard.value = false
  collapse()
}

const isOpen = (card: Card) => (expanded.value === card.task.id || isEditing(card)) && !card.dragged

function cardClass(card: Card) {
  const t = card.task
  return [
    isEditing(card) ? 'z-40 shadow-lg ring-2 ring-inverted cursor-text'
        : isOpen(card) ? 'z-30 shadow-lg ring-inverted' : 'ring-default',
    card.span === 2 ? 'py-1.5' : 'py-[5px]',
    // Выполненная — бледная; частично — бледная левая половина (правая белая — слой внутри карточки)
    t.status === 'TODO' ? 'bg-white text-default' : 'bg-white/40',
    t.status === 'DONE' ? 'text-dimmed' : 'text-default',
    t.movedAt && 'opacity-50',
    card.dragged && 'z-40 shadow-md outline-dashed outline-[1.5px] -outline-offset-1',
    card.dragged && (noRoom.value ? 'outline-error' : 'outline-inverted'),
    !isEditing(card) && (drag.value?.active ? (drag.value.copy ? 'cursor-copy' : 'cursor-grabbing') : 'cursor-grab'),
  ]
}

function cardStyle(card: Card) {
  const height = card.span * SLOT - 2
  return {top: `${card.slot * SLOT + 1}px`, minHeight: `${height}px`, height: isOpen(card) ? 'auto' : `${height}px`}
}

// ── Правка названия прямо в карточке ──
// Клик по карточке (или Enter / F2) — поле на месте названия; клик по пустой ячейке — новая карточка с полем.
// Enter или клик мимо — сохранить, Esc — отменить; пустое не сохраняется (новая задача не создаётся).
// Новое название видно сразу, до ответа сервера
const NEW_ID = '__new__'
const editingId = ref<string | null>(null)
const newCard = ref<{ day: string; slot: number; title: string } | null>(null)   // title — уже сохраняется
const draft = ref('')
const editor = ref<HTMLTextAreaElement | null>(null)
const setEditor = (el: unknown) => (editor.value = (el as HTMLTextAreaElement | null) ?? null)
let editEndedAt = 0     // клик мимо поля только заканчивает правку, а не создаёт новую задачу
const pendingTitles = ref(new Map<string, string>())

watch(() => props.tasks, () => {
  pendingTitles.value = new Map()
  if (newCard.value?.title) newCard.value = null
})

const isEditing = (card: Card) => editingId.value === card.key

function newTask(n: { day: string; slot: number; title: string }): PlanTaskItem {
  return {id: NEW_ID, title: n.title, status: 'TODO', day: n.day, startMin: slotMin(n.slot), movedAt: null} as PlanTaskItem
}

const titleOf = (card: Card) => pendingTitles.value.get(card.task.id) ?? card.task.title

function focusEditor() {
  nextTick(() => {
    const el = editor.value
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    fitEditor()
  })
}

function fitEditor() {
  const el = editor.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function startEdit(id: string) {
  const task = byId.value.get(id)
  if (!task || props.busy) return
  collapse()
  if (!newCard.value?.title) newCard.value = null     // новая, которая уже сохраняется, остаётся видна
  draft.value = pendingTitles.value.get(id) ?? task.title
  editingId.value = id
  focusEditor()
}

function startNew(day: string, slot: number) {
  collapse()
  newCard.value = {day, slot, title: ''}
  draft.value = ''
  editingId.value = NEW_ID
  focusEditor()
}

function commitEdit() {
  const id = editingId.value
  if (!id) return
  editingId.value = null
  editEndedAt = Date.now()
  const title = draft.value.replace(/\s+/g, ' ').trim()
  if (id === NEW_ID) {
    const n = newCard.value
    if (!n || !title) return void (newCard.value = null)
    n.title = title
    emit('create', n.day, slotMin(n.slot), title)
    return
  }
  const task = byId.value.get(id)
  if (!task || !title || title === (pendingTitles.value.get(id) ?? task.title)) return
  pendingTitles.value = new Map(pendingTitles.value).set(id, title)
  emit('rename', task, title)
}

function cancelEdit() {
  const id = editingId.value
  editingId.value = null
  editEndedAt = Date.now()
  if (id === NEW_ID) newCard.value = null
}

// ── Прокрутка к первой задаче (или к 8:00) ──
const gridEl = ref<HTMLElement | null>(null)
const headerEl = ref<HTMLElement | null>(null)
let scrolledFor = ''

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  let p = el?.parentElement ?? null
  while (p) {
    const s = getComputedStyle(p).overflowY
    if (s === 'auto' || s === 'scroll') return p
    p = p.parentElement
  }
  return null
}

function scrollToStart() {
  const grid = gridEl.value
  const sp = scrollParent(grid)
  if (!grid || !sp) return
  const slots = [...layout.value.values()].flatMap(m => [...m.values()])
  const first = slots.length ? slotMin(Math.min(...slots)) : 8 * 60
  const offset = grid.getBoundingClientRect().top - sp.getBoundingClientRect().top + sp.scrollTop
  const header = headerEl.value?.offsetHeight ?? 0
  sp.scrollTo({top: Math.max(0, offset + (Math.max(0, first - 30) / PLAN_SLOT_MIN) * SLOT - header)})
}

function maybeScroll() {
  if (props.pending || scrolledFor === props.period) return
  scrolledFor = props.period
  nextTick(scrollToStart)
}

watch(() => [props.period, props.pending], maybeScroll, {flush: 'post'})

onMounted(() => {
  tick()
  timer = setInterval(tick, 60_000)
  maybeScroll()
})
onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(expandTimer)
})

defineExpose({focusAdd: () => {}})

// Линии: час — сплошная, полчаса — бледная
const gridLines = {
  backgroundImage: [
    `repeating-linear-gradient(to bottom, var(--ui-border) 0, var(--ui-border) 1px, transparent 1px, transparent ${HOUR}px)`,
    `repeating-linear-gradient(to bottom, color-mix(in oklab, var(--ui-border) 45%, transparent) 0, color-mix(in oklab, var(--ui-border) 45%, transparent) 1px, transparent 1px, transparent ${HOUR / 2}px)`,
  ].join(', '),
}
</script>

<template>
  <div class="relative" :class="drag?.active && 'select-none'">
    <!-- Шапка дней -->
    <div
        ref="headerEl"
        class="sticky top-0 z-50 grid grid-cols-[56px_repeat(7,minmax(0,1fr))] bg-white/90 backdrop-blur rounded-xs"
    >
      <div/>
      <div
          v-for="(day, i) in days"
          :key="day"
          class="text-center py-2 text-sm border-l border-default"
          :class="day === today ? 'font-semibold text-highlighted' : 'text-toned'"
      >
        {{ WEEKDAYS_SHORT[i] }}
        <span
            class="inline-flex items-center justify-center min-w-7 h-7 rounded-full ms-1"
            :class="day === today && 'bg-inverted text-inverted'"
        >
          {{ Number(day.slice(8)) }}
        </span>
      </div>
    </div>

    <div
        ref="gridEl"
        class="relative grid grid-cols-[56px_repeat(7,minmax(0,1fr))]"
        :style="{ height: `${24 * HOUR}px` }"
    >
      <!-- Шкала -->
      <div class="relative">
        <span
            v-for="h in 23"
            :key="h"
            class="absolute right-2 text-xs text-dimmed tabular-nums -translate-y-1/2"
            :style="{ top: `${h * HOUR}px` }"
        >
          {{ pad(h) }}:00
        </span>
      </div>

      <!-- Дни -->
      <div
          v-for="(day, i) in days"
          :key="day"
          :ref="el => setCol(day, el)"
          class="relative border-l border-default"
          :class="[day === today && 'bg-white/40', !drag && 'cursor-plus']"
          :style="gridLines"
          @click="onColumnClick($event, day)"
          @mousemove="onColumnMove($event, day)"
          @mouseleave="hover = null"
      >
        <!-- Пустая ячейка под мышью: линия с временем (клик — новая задача) -->
        <div
            v-if="showLine(day)"
            class="absolute inset-x-0 border-t border-inverted/70 bg-elevated/60 pointer-events-none"
            :style="{ top: `${hover!.slot * SLOT}px`, height: `${SLOT}px` }"
        >
          <span class="absolute right-1.5 top-1 text-xs leading-none tabular-nums text-toned">
            {{ minToTime(slotMin(hover!.slot)) }}
          </span>
        </div>

        <!-- Задачи: сплошной блок «время название» -->
        <div
            v-for="card in columns[i] ?? []"
            :key="card.key"
            tabindex="0"
            role="button"
            class="group absolute inset-x-0.5 px-1.5 rounded-xs ring ring-inset text-xs leading-4 overflow-hidden
                   touch-none select-none hover:ring-inverted focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted"
            :class="cardClass(card)"
            :style="cardStyle(card)"
            @click.stop
            @pointerdown="onCardDown($event, card, day)"
            @mouseenter="onCardEnter($event, card)"
            @mouseleave="onCardLeave"
            @keydown.enter.self.prevent="startEdit(card.task.id)"
            @keydown.f2.self.prevent="startEdit(card.task.id)"
        >
          <!-- «Частично»: правая половина белая, посередине пунктир -->
          <template v-if="card.task.status === 'PARTIAL'">
            <span class="absolute inset-y-0 right-0 w-1/2 bg-white pointer-events-none"/>
            <span class="absolute left-1/2 top-1 bottom-1 border-l border-dashed border-accented pointer-events-none"/>
          </template>

          <!-- Правка: время и поле на месте названия -->
          <div v-if="isEditing(card)" class="relative flex gap-1">
            <span class="shrink-0 tabular-nums opacity-70">{{ minToTime(slotMin(card.slot)) }}</span>
            <textarea
                :ref="setEditor"
                v-model="draft"
                rows="1"
                maxlength="300"
                aria-label="Название задачи"
                placeholder="Название — Enter"
                class="flex-1 min-w-0 resize-none overflow-hidden bg-transparent p-0 text-xs leading-4 outline-none
                       placeholder:text-dimmed"
                @input="fitEditor"
                @pointerdown.stop
                @click.stop
                @blur="commitEdit"
                @keydown.enter.exact.stop.prevent="editor?.blur()"
                @keydown.esc.stop.prevent="cancelEdit"
            />
          </div>

          <div
              v-else
              data-title
              class="relative break-words"
              :class="isOpen(card) ? '' : card.span === 2 ? 'line-clamp-2' : 'truncate'"
          >
            <span class="tabular-nums opacity-70">{{ minToTime(slotMin(card.slot)) }}</span>
            {{ titleOf(card) }}
          </div>

          <!-- ⋮ — при наведении на правый верхний угол. Видна и при фокусе с клавиатуры (focus-visible), но не после
               закрытия меню мышью: меню возвращает фокус на кнопку, и с focus-within она оставалась видна -->
          <span
              v-if="!card.dragged && !isEditing(card) && card.key !== NEW_ID"
              class="absolute top-px right-px z-10 flex rounded-xs bg-white/95 opacity-0 hover:opacity-100
                     has-[:focus-visible]:opacity-100 has-[[data-state=open]]:opacity-100"
          >
            <PlanTaskMenu
                :task="card.task"
                scope="week"
                week
                compact
                @action="a => emit('action', card.task, a)"
            />
          </span>
        </div>

        <!-- Линия «сейчас» -->
        <div
            v-if="day === today"
            class="absolute inset-x-0 z-[15] h-0.5 bg-red-500 pointer-events-none"
            :style="{ top: `${(nowMin / PLAN_SLOT_MIN) * SLOT}px` }"
        >
          <span class="absolute -left-1 -top-1 size-2.5 rounded-full bg-red-500"/>
        </div>
      </div>
    </div>
  </div>
</template>
