<script setup lang="ts">
import type {PlanStatus, PlanTaskItem} from '~~/shared/types/plan'
import {
  MONTHS, MONTHS_GEN, WEEKDAYS_SHORT, addDays, minToTime, parseISO, periodTitle, shiftPeriod,
  type PlanScopeKey,
} from '~~/shared/utils/planDates'
import {NEXT_LABEL, STATUS_LABEL, STATUS_ORDER, displayOrder, percentOf, planStats} from '~~/shared/utils/planTasks'

// Режим итогов: все действия копятся в черновике и применяются одной кнопкой
const props = defineProps<{
  tasks: PlanTaskItem[]
  scope: PlanScopeKey
  period: string
  weekView?: 'list' | 'plan'   // неделя: какая вкладка открывается первой
}>()
const emit = defineEmits<{
  close: []
  applied: [nextPeriod: string]
  dirty: [value: boolean]
}>()

const api = useApi()
const toast = useToast()

const NEXT_SHORT: Record<PlanScopeKey, string> = {
  day: 'Завтра',
  week: 'След. неделя',
  month: 'След. месяц',
  year: 'След. год',
  year2: 'След. 2 года',
  year3: 'След. 3 года',
}

// ── Черновик ──
type Action = 'move' | 'copy'

interface Target {
  period?: string   // ключ периода (день, неделя списка, месяц, годы)
  day?: string      // задача плана недели — конкретный день
}

interface DraftItem {
  action?: Action
  target?: Target   // не задано — следующий период
  status?: PlanStatus
  comment?: string
}

const draft = reactive<Record<string, DraftItem>>({})
const newTasks = ref<string[]>([])
const newDraft = ref('')
const note = ref('')
const originalNote = ref('')
const loadingNote = ref(true)
const applying = ref(false)

const statusOf = (t: PlanTaskItem) => draft[t.id]?.status ?? t.status
const commentOf = (t: PlanTaskItem) => draft[t.id]?.comment ?? t.comment ?? ''
const actionOf = (t: PlanTaskItem) => draft[t.id]?.action

function patch(t: PlanTaskItem, change: DraftItem) {
  const next: DraftItem = {...draft[t.id], ...change}
  // Убираем то, что совпадает с исходным состоянием
  if (next.status === t.status) delete next.status
  if (next.comment !== undefined && next.comment.trim() === (t.comment ?? '')) delete next.comment
  if (!next.action) {
    delete next.action
    delete next.target
  }
  if (!next.target) delete next.target
  if (Object.keys(next).length) draft[t.id] = next
  else delete draft[t.id]
}

function setStatus(t: PlanTaskItem, s: PlanStatus) {
  const value: PlanStatus = statusOf(t) === s ? 'TODO' : s
  // Выполненную задачу не переносим — только копия
  patch(t, {status: value, ...(value === 'DONE' && actionOf(t) === 'move' ? {action: undefined} : {})})
}

function toggleAction(t: PlanTaskItem, a: Action) {
  // Смена действия сохраняет выбранную дату
  patch(t, {action: actionOf(t) === a ? undefined : a})
}

// ── Куда: по умолчанию следующий период, по ссылке в метке — календарь ──
const DEFAULT_TARGET: Record<PlanScopeKey, string> = {
  day: 'завтра',
  week: 'след. неделю',
  month: 'след. месяц',
  year: 'след. год',
  year2: 'след. 2 года',
  year3: 'след. 3 года',
}

const targetOf = (t: PlanTaskItem) => draft[t.id]?.target
const usesDayPicker = (t: PlanTaskItem) => props.scope === 'day' || (props.scope === 'week' && !!t.day)

function shortDay(iso: string) {
  const d = parseISO(iso)
  return `${WEEKDAYS_SHORT[(d.getUTCDay() + 6) % 7]}, ${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]!.slice(0, 3)}`
}

function targetLabel(t: PlanTaskItem) {
  const tg = targetOf(t)
  if (!tg) return DEFAULT_TARGET[props.scope]
  if (tg.day) return shortDay(tg.day)
  const key = tg.period!
  switch (props.scope) {
    case 'day': return shortDay(key)
    case 'week': {
      const d = parseISO(key)
      return `неделю ${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]!.slice(0, 3)}`
    }
    case 'month': {
      const d = parseISO(`${key}-01`)
      return `${MONTHS[d.getUTCMonth()]!.toLowerCase()} ${d.getUTCFullYear()}`
    }
    case 'year': return `${key} год`
    default: return key.replace('-', '–')
  }
}

// Что выделить в календаре: выбранное или следующий период
function pickerSelected(t: PlanTaskItem) {
  const tg = targetOf(t)
  if (usesDayPicker(t)) {
    if (tg?.day || tg?.period) return (tg.day ?? tg.period)!
    return props.scope === 'week' ? addDays(t.day!, 7) : addDays(props.period, 1)
  }
  return tg?.period ?? shiftPeriod(props.scope, props.period, 1)
}

const pickerFor = ref<string | null>(null)

function setTarget(t: PlanTaskItem, value: string) {
  const target: Target = props.scope === 'week' && t.day ? {day: value} : {period: value}
  const samePlace = props.scope === 'week' && t.day
      ? value === t.day
      : value === props.period
  if (actionOf(t) === 'move' && samePlace) {
    toast.add({title: 'Выберите другой день', description: 'Перенести задачу на то же место нельзя', color: 'warning'})
    return
  }
  const isDefault = !targetOf(t) && value === pickerSelected(t)
  patch(t, {target: isDefault ? undefined : target})
  pickerFor.value = null
}

const isChanged = (t: PlanTaskItem) => !!draft[t.id]

// ── Списки ──
const active = computed(() => props.tasks.filter(t => !t.movedAt))
const movedCount = computed(() => props.tasks.length - active.value.length)

// План недели сгруппирован по дням — в строке только время
const whenLabel = (t: PlanTaskItem) => (t.day ? minToTime(t.startMin) : '')   // план недели: только начало (2.0)

// Неделя: «Список» и «План» отдельно; остальные периоды — одна группа
// Неделя: вкладки «Список» и «План», черновик у них общий
const weekTab = ref<'list' | 'plan'>(props.weekView ?? 'list')
const listTasks = computed(() => active.value.filter(t => !t.day))
const planTasks = computed(() => active.value.filter(t => t.day))
const tabChanged = (list: PlanTaskItem[]) => list.some(t => draft[t.id])

// Разделы: у списков — по статусам, у плана недели — по дням (внутри по времени)
const sections = computed(() => {
  const byStatus = (list: PlanTaskItem[]) => STATUS_ORDER
      .map(s => ({key: s, label: STATUS_LABEL[s], tasks: list.filter(t => t.status === s)}))
      .filter(g => g.tasks.length)

  if (props.scope !== 'week') return byStatus(displayOrder(active.value))
  if (weekTab.value === 'list') return byStatus(displayOrder(listTasks.value))

  const plan = [...planTasks.value].sort((a, b) => a.day!.localeCompare(b.day!) || a.startMin! - b.startMin!)
  const days: { key: string; label: string; tasks: PlanTaskItem[] }[] = []
  for (const t of plan) {
    const last = days[days.length - 1]
    if (last?.key === t.day) last.tasks.push(t)
    else days.push({key: t.day!, label: shortDay(t.day!), tasks: [t]})
  }
  return days
})

// Новые задачи — только в списках (у плана недели для них нужен день и время)
const canAddNew = computed(() => props.scope !== 'week' || weekTab.value === 'list')

// ── Сводка ──
const stats = computed(() => planStats(props.tasks.map(t => ({...t, status: statusOf(t)}))))
const donePct = computed(() => percentOf(stats.value.done, stats.value.total))

const summary = computed(() => {
  const items = Object.values(draft)
  const parts: string[] = []
  const moved = items.filter(i => i.action === 'move').length
  const copied = items.filter(i => i.action === 'copy').length
  const statuses = items.filter(i => i.status).length
  const comments = items.filter(i => i.comment !== undefined).length
  // Читается как «Будет: перенесено 1 · скопировано 2 · …»
  if (moved) parts.push(`перенесено ${moved}`)
  if (copied) parts.push(`скопировано ${copied}`)
  if (newTasks.value.length) parts.push(`добавлено задач ${newTasks.value.length}`)
  if (statuses) parts.push(`обновлено статусов ${statuses}`)
  if (comments) parts.push(`изменено комментариев ${comments}`)
  if (noteDirty.value) parts.push('изменена заметка')
  return parts
})

const noteDirty = computed(() => note.value.trim() !== originalNote.value.trim())
const dirty = computed(() => Object.keys(draft).length > 0 || newTasks.value.length > 0 || noteDirty.value)
watch(dirty, v => emit('dirty', v), {immediate: true})

// ── Заметка ──
onMounted(async () => {
  try {
    const res = await api<{ note: string }>('/api/plan/review', {query: {scope: props.scope, period: props.period}})
    note.value = originalNote.value = res.note
  } catch {
    note.value = originalNote.value = ''
  } finally {
    loadingNote.value = false
  }
})

// ── Новые задачи ──
function addNew() {
  const title = newDraft.value.trim()
  if (!title) return
  newTasks.value.push(title)
  newDraft.value = ''
}

// ── Кнопки ──
function reset() {
  for (const id of Object.keys(draft)) delete draft[id]
  newTasks.value = []
  newDraft.value = ''
  note.value = originalNote.value
}

function close() {
  if (dirty.value && !window.confirm('Есть неприменённые изменения итогов. Выйти без них?')) return
  emit('close')
}

async function apply() {
  if (applying.value) return
  applying.value = true
  try {
    const items = Object.entries(draft).map(([id, d]) => ({
      id,
      ...(d.action ? {action: d.action} : {}),
      ...(d.action && d.target ? {target: d.target} : {}),
      ...(d.status ? {status: d.status} : {}),
      ...(d.comment !== undefined ? {comment: d.comment.trim() || null} : {}),
    }))
    const sent = {
      statuses: items.filter(i => 'status' in i).length,
      comments: items.filter(i => 'comment' in i).length,
      note: noteDirty.value,
    }
    const res = await api<{ period: string; moved: number; copied: number; created: number }>(
        '/api/plan/review/apply',
        {
          method: 'POST',
          body: {
            scope: props.scope,
            period: props.period,
            items,
            newTasks: newTasks.value,
            ...(noteDirty.value ? {note: note.value} : {}),
          },
        },
    )
    // Что сделано — те же пункты, что в сводке «Будет: …», только в прошедшем времени
    const done = [
      res.moved && `перенесено ${res.moved}`,
      res.copied && `скопировано ${res.copied}`,
      res.created && `добавлено задач ${res.created}`,
      sent.statuses && `обновлено статусов ${sent.statuses}`,
      sent.comments && `изменено комментариев ${sent.comments}`,
      sent.note && 'заметка сохранена',
    ].filter(Boolean).join(' · ')
    toast.add({
      title: 'Итоги подведены',
      description: done || undefined,
      color: 'success',
      ui: {root: 'rounded-xs'},
      actions: res.moved || res.copied || res.created
          ? [{
            label: 'Открыть',
            color: 'neutral',
            variant: 'outline',
            onClick: () => navigateTo(`/plan/${props.scope}/${res.period}`),
          }]
          : undefined,
    })
    reset()
    emit('applied', res.period)
  } catch (e: any) {
    toast.add({title: 'Не удалось применить итоги', description: e?.data?.message, color: 'error'})
  } finally {
    applying.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && !e.defaultPrevented) {
    const target = e.target as HTMLElement | null
    if (target?.closest('[role="menu"], [role="listbox"], [role="dialog"]')) return
    e.preventDefault()
    // Esc в поле ввода — просто выйти из поля
    if (target?.closest('input, textarea')) return (target as HTMLElement).blur()
    close()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    apply()
  }
}

useEventListener(import.meta.client ? window : undefined, 'keydown', onKeydown)
useEventListener(import.meta.client ? window : undefined, 'beforeunload', (e: BeforeUnloadEvent) => {
  if (dirty.value) e.preventDefault()
})

defineExpose({dirty})

// Комментарий к задаче в итогах убран (2.0) — остаётся заметка к периоду

// Поле растёт по высоте вместе с текстом
// Только что показанное поле ещё не размечено браузером — меряем высоту в следующем кадре
function autosize(el: unknown) {
  if (!(el instanceof HTMLTextAreaElement)) return
  const fit = () => {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  fit()
  requestAnimationFrame(fit)
}

const CARD = 'rounded-xs ring ring-inset ring-default'
// Значки — как ✓ ½: выбранный обведён толстой рамкой, без заливки
const ICON = 'size-8 shrink-0 rounded-xs flex items-center justify-center transition-colors'
const iconClass = (on: boolean) => on
    ? `${ICON} ring-2 ring-gray-500 text-highlighted bg-white`
    : `${ICON} ring ring-accented text-muted bg-white hover:ring-inverted/60 hover:text-toned`
</script>

<template>
  <div class="space-y-3">
    <!-- Полоса режима: остаётся наверху при прокрутке -->
    <div class="sticky top-0 z-20 rounded-xs ring ring-inset ring-accented bg-white/95 backdrop-blur p-3 space-y-2">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-5 min-w-0">
          <span class="font-medium text-highlighted flex items-center gap-1.5 whitespace-nowrap">
            <UIcon name="i-lucide-clipboard-check" class="size-4"/>
            Итоги: {{ periodTitle(scope, period) }}
          </span>

          <!-- Неделя: вкладки — текстовые ссылки, выбранная жирная и подчёркнута -->
          <nav v-if="scope === 'week'" class="flex items-center gap-4 text-sm">
            <button
                v-for="tab in ([['list', 'Список', listTasks], ['plan', 'План', planTasks]] as const)"
                :key="tab[0]"
                type="button"
                class="flex items-center gap-1.5 underline-offset-4 decoration-2"
                :class="weekTab === tab[0]
                  ? 'font-semibold text-highlighted underline'
                  : 'text-toned hover:text-highlighted hover:underline decoration-1'"
                @click="weekTab = tab[0]"
            >
              {{ tab[1] }} · {{ tab[2].length }}
              <span v-if="tabChanged(tab[2])" class="size-1.5 rounded-full bg-warning"/>
            </button>
          </nav>
        </div>
        <span class="text-xs tabular-nums text-dimmed">
          {{ stats.done }} из {{ stats.total }} выполнено
          <template v-if="stats.partial"> · ½ {{ stats.partial }}</template>
          · {{ donePct }}%
        </span>
      </div>
      <label class="block space-y-1">
        <span class="flex items-center gap-1.5 text-sm font-medium text-default">
          Заметка к периоду
          <span v-if="noteDirty" class="size-1.5 rounded-full bg-warning"/>
        </span>
        <textarea
            :ref="autosize"
            v-model="note"
            rows="1"
            :disabled="loadingNote"
            placeholder="Что получилось, что мешало, что учесть дальше"
            class="block w-full resize-none overflow-hidden rounded-xs bg-white px-2.5 py-1.5 text-sm
                   ring ring-inset ring-accented outline-none focus:ring-2 focus:ring-inverted
                   placeholder:text-dimmed"
            @input="autosize($event.target)"
        />
      </label>
    </div>

    <p v-if="!active.length" class="text-sm text-dimmed">
      Задач в этом периоде нет{{ movedCount ? ' — все перенесены' : '' }}.
    </p>

    <!-- Задачи -->
    <p v-if="scope === 'week' && !sections.length && active.length" class="text-sm text-dimmed">
      {{ weekTab === 'list' ? 'В списке недели задач нет.' : 'В плане недели задач нет.' }}
    </p>

    <div class="space-y-1.5">
      <template v-for="section in sections" :key="section.key">
        <USeparator
            :label="`${section.label} · ${section.tasks.length}`"
            :ui="{ label: 'text-xs text-dimmed' }"
            class="pt-3 pb-1"
        />

        <div
            v-for="t in section.tasks"
            :key="t.id"
            data-card
        >
          <!-- Строка задачи -->
          <div
              class="flex items-center gap-2 ps-2 pe-2 h-12"
              :class="[CARD, statusOf(t) === 'TODO' ? 'bg-white/70' : 'bg-white/40 text-dimmed']"
          >
            <span class="size-1.5 shrink-0 rounded-full" :class="isChanged(t) ? 'bg-warning' : 'bg-transparent'"/>
            <span v-if="t.day" class="w-10 shrink-0 text-xs tabular-nums text-toned">{{ whenLabel(t) }}</span>
            <span class="flex-1 min-w-0 truncate text-base" :title="t.title">{{ t.title }}</span>

            <!-- Выбранное действие; «куда» — ссылка, открывает календарь -->
            <span
                v-if="actionOf(t)"
                class="shrink-0 text-[11px] text-toned ring ring-inset ring-default rounded-xs px-1.5 py-0.5 whitespace-nowrap
                       flex items-center gap-1"
            >
              {{ actionOf(t) === 'move' ? '→ перенос на' : 'копия на' }}
              <UPopover
                  :open="pickerFor === t.id"
                  :content="{ align: 'end' }"
                  @update:open="v => (pickerFor = v ? t.id : null)"
              >
                <button
                    type="button"
                    class="underline decoration-dotted underline-offset-2 text-highlighted hover:decoration-solid hover:bg-elevated rounded-xs px-0.5"
                    title="Выбрать дату"
                >
                  {{ targetLabel(t) }}
                </button>
                <template #content>
                  <div class="p-3">
                    <PlanMiniCalendar
                        v-if="usesDayPicker(t)"
                        :selected="pickerSelected(t)"
                        mode="day"
                        @select="(iso: string) => setTarget(t, iso)"
                    />
                    <PlanPeriodPicker
                        v-else
                        :scope="scope"
                        :period="pickerSelected(t)"
                        @select="(key: string) => setTarget(t, key)"
                    />
                  </div>
                </template>
              </UPopover>
            </span>

            <div class="flex items-center gap-1 shrink-0">
              <UTooltip :text="`Копия ${NEXT_LABEL[scope]}`">
                <button
                    type="button"
                    :class="iconClass(actionOf(t) === 'copy')"
                    :aria-label="`Копия ${NEXT_LABEL[scope]}`"
                    @click="toggleAction(t, 'copy')"
                >
                  <UIcon name="i-lucide-copy" class="size-4"/>
                </button>
              </UTooltip>

              <span class="w-px h-5 bg-(--ui-border-accented) mx-1"/>
              <PlanStatusIcons :status="statusOf(t)" @set="s => setStatus(t, s)"/>
            </div>
          </div>

        </div>
      </template>
    </div>

    <p v-if="movedCount" class="text-xs text-dimmed">Перенесено ранее: {{ movedCount }}.</p>

    <!-- Новые задачи на следующий период -->
    <div v-if="canAddNew" class="space-y-1.5">
      <USeparator
          :label="`Новые задачи ${NEXT_LABEL[scope]} · ${newTasks.length}`"
          :ui="{ label: 'text-xs text-dimmed' }"
          class="pt-3 pb-1"
      />
      <UInput
          v-model="newDraft"
          icon="i-lucide-plus"
          :placeholder="`Новая задача ${NEXT_LABEL[scope]} — Enter, чтобы добавить`"
          class="w-full"
          :ui="{ base: 'h-12 text-base' }"
          @keydown.enter.prevent="addNew"
      />
      <div
          v-for="(title, i) in newTasks"
          :key="`${i}-${title}`"
          :class="[CARD, 'bg-white/70 flex items-center gap-2 ps-2 pe-2 h-12']"
      >
        <span class="size-1.5 shrink-0 rounded-full bg-warning"/>
        <span class="flex-1 min-w-0 truncate text-base">{{ title }}</span>
        <UTooltip text="Убрать">
          <button type="button" :class="iconClass(false)" aria-label="Убрать" @click="newTasks.splice(i, 1)">
            <UIcon name="i-lucide-x" class="size-4"/>
          </button>
        </UTooltip>
      </div>
    </div>

    <!-- Сводка и кнопки -->
    <div class="sticky bottom-0 z-10 flex items-center gap-2 rounded-xs ring-2 ring-inset ring-inverted bg-white py-1.5 px-2 ps-3">
      <span class="flex-1 min-w-0 text-sm text-toned truncate">
        <template v-if="summary.length">Будет: {{ summary.join(' · ') }}</template>
        <template v-else>Изменений нет — можно отметить итоги подведёнными</template>
      </span>
      <template v-if="dirty">
        <UButton label="Отмена" size="sm" class="w-[130px] justify-center" @click="reset"/>
        <UButton label="Применить" icon="i-lucide-check" size="sm" class="w-[130px] justify-center" :loading="applying" @click="apply"/>
      </template>
      <template v-else>
        <UButton label="Выйти" size="sm" class="w-[130px] justify-center" @click="close"/>
        <UButton
            label="Подведены"
            icon="i-lucide-check"
            size="sm"
            class="w-[130px] justify-center"
            title="Отметить итоги подведёнными"
            :loading="applying"
            @click="apply"
        />
      </template>
    </div>
  </div>
</template>
