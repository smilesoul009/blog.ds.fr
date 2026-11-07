<script setup lang="ts">
definePageMeta({key: 'plan'})
import {
  isPlanScope,
  isValidPeriodKey,
  periodKeyFor,
  periodStartISO,
  periodTitle,
  type PlanScopeKey,
  shiftPeriod,
  todayISO,
} from '~~/shared/utils/planDates'
import type {PlanStatus, PlanTaskItem} from '~~/shared/types/plan'

const route = useRoute()
const api = useApi()
const toast = useToast()

// Адрес: /plan/<вид периода>/<период> — список задач («Временные»: Год, Месяц, Неделя, День);
// /plan/weekly/<неделя> — сетка недели на 7 дней («Еженедельный план»), вид периода — неделя
const base = computed(() => route.params.scope as string)
const weekly = computed(() => base.value === 'weekly')
const scope = computed(() => (weekly.value ? 'week' : base.value) as PlanScopeKey)
const period = computed(() => route.params.period as string)

if (!isPlanScope(scope.value) || !isValidPeriodKey(scope.value, period.value)) {
  await navigateTo('/plan/now', {replace: true})
}

watch([scope, period], ([s, p]) => {
  if (!isPlanScope(s) || !isValidPeriodKey(s, p)) navigateTo('/plan/now', {replace: true})
})

const lastScope = usePlanScope()
watchEffect(() => {
  if (isPlanScope(scope.value)) lastScope.value = scope.value
})

// Задачи показываем, только если они загружены для открытого периода. Иначе при переходе (например, с недели
// на месяц) на миг видны задачи прежнего периода — у недели без фильтра «без времени» это весь список («моргание»)
const requestKey = computed(() => `${scope.value}/${period.value}`)
const loadedKey = ref('')

const {data, status, error, refresh} = await useFetch<{ items: PlanTaskItem[] }>('/api/plan', {
  query: computed(() => ({scope: scope.value, period: period.value})),
})
loadedKey.value = requestKey.value     // первая загрузка (в том числе на сервере) — для открытого периода
// Пришли данные — они для периода, который сейчас открыт (запрос уходит при смене адреса)
watch([data, status], () => {
  if (status.value === 'success') loadedKey.value = requestKey.value
})
const tasks = computed(() => (loadedKey.value === requestKey.value ? data.value?.items ?? [] : []))
// Неделя: «Еженедельный» (сетка) — задачи с днём и временем; «Неделя» (список) — без них
const isWeekPlan = weekly
const gridTasks = computed(() => tasks.value.filter(t => t.day))
const listTasks = computed(() => (scope.value === 'week' ? tasks.value.filter(t => !t.day) : tasks.value))

// Общее состояние полного экрана контролируется постоянным layout «Плана».
const fullscreen = useState<boolean>('plan-fullscreen-active', () => false)

const list = ref<{ focusAdd: () => void; focusItem?: (id: string) => void } | null>(null)
// Режим итогов: показывается вместо списка; изменения копятся в черновике панели
const reviewMode = ref(false)
const reviewDirty = ref(false)

function confirmDropReview() {
  return !reviewDirty.value || window.confirm('Есть неприменённые изменения итогов. Выйти без них?')
}

function toggleReview() {
  if (!reviewMode.value) return (reviewMode.value = true)
  if (confirmDropReview()) reviewMode.value = false
}

function onReviewApplied() {
  reviewMode.value = false
  refresh()
}

// Уход на другой период или страницу с неприменёнными итогами — спрашиваем
onBeforeRouteUpdate((to, from) => {
  const samePage = to.params.scope === from.params.scope && to.params.period === from.params.period
  if (!samePage && reviewMode.value && !confirmDropReview()) return false
})
onBeforeRouteLeave(() => {
  if (reviewMode.value && !confirmDropReview()) return false
})
watch([base, period], () => {
  reviewMode.value = false
  reviewDirty.value = false
})

// Итоги периода: подведены ли (значок у прогресса)
const {data: reviewData, refresh: refreshReview} = useFetch<{ note: string; reviewedAt: string | null }>(
    '/api/plan/review',
    {query: computed(() => ({scope: scope.value, period: period.value})), server: false},
)
const reviewed = computed(() => !!reviewData.value?.reviewedAt)
watch(reviewMode, on => !on && refreshReview())

// Ссылка ?review=1 (например, из напоминания) сразу открывает итоги
// В «Еженедельном» итогов нет (прогресса тоже): итоги недели — в «Неделе»
function openReviewFromQuery() {
  if (route.query.review !== '1' || weekly.value) return
  reviewMode.value = true
  navigateTo({query: {...route.query, review: undefined}}, {replace: true})
}

onMounted(openReviewFromQuery)
watch(() => route.query.review, openReviewFromQuery)
// План недели: новая задача — клик по пустой ячейке, название вводится прямо в карточке
async function createWeekTask(day: string, startMin: number, title: string) {
  try {
    await api('/api/plan', {method: 'POST', body: {scope: scope.value, period: period.value, title, day, startMin}})
  } catch (e: any) {
    toast.add({title: 'Не удалось добавить', description: e?.data?.message, color: 'error'})
  }
  await refresh()
}

// План недели: перетаскивание на другой день и время, с Ctrl — копия (занятые ячейки сдвигаются на сервере)
async function placeTask(task: PlanTaskItem, day: string, startMin: number, copy: boolean) {
  try {
    await api(`/api/plan/${task.id}/place`, {method: 'POST', body: {day, startMin, copy}})
  } catch (e: any) {
    toast.add({title: copy ? 'Не удалось скопировать' : 'Не удалось переместить', description: e?.data?.message, color: 'error'})
  }
  await refresh()
}

async function setStatus(task: PlanTaskItem, next: PlanStatus) {
  const value: PlanStatus = task.status === next ? 'TODO' : next
  try {
    await api(`/api/plan/${task.id}`, {method: 'PATCH', body: {status: value}})
    await refresh()
  } catch (e: any) {
    toast.add({title: 'Не удалось изменить статус', description: e?.data?.message, color: 'error'})
  }
}

// Название — правится прямо в строке списка (и в карточке плана недели)
async function renameTask(task: PlanTaskItem, title: string) {
  try {
    await api(`/api/plan/${task.id}`, {method: 'PATCH', body: {title}})
  } catch (e: any) {
    toast.add({title: 'Не удалось переименовать', description: e?.data?.message, color: 'error'})
  }
  await refresh()
}

async function reorder(ids: string[], moved?: { id: string; status: PlanStatus }, focusId?: string) {
  try {
    await api('/api/plan/reorder', {
      method: 'POST',
      body: {scope: scope.value, period: period.value, ids, moved},
    })
  } catch (e: any) {
    toast.add({title: 'Не удалось изменить порядок', description: e?.data?.message, color: 'error'})
  }
  await refresh()
  if (focusId) nextTick(() => list.value?.focusItem?.(focusId))
}

// ── Копирование (перенос убран в 2.0; сервер его ещё умеет — /api/plan/[id]/transfer, mode: 'move') ──
const transferOpen = ref(false)
const transferTask = ref<PlanTaskItem | null>(null)
const transferKind = ref<'copy'>('copy')

async function transfer(task: PlanTaskItem, kind: 'copy', target: { period?: string; day?: string } = {}) {
  try {
    const res = await api<{ period: string }>(`/api/plan/${task.id}/transfer`, {
      method: 'POST',
      body: {mode: kind, ...target},
    })
    const where = periodTitle(scope.value, res.period)
    toast.add({
      title: 'Задача скопирована',
      description: where,
      color: 'success',
      actions: [{
        label: 'Открыть', color: 'neutral', variant: 'outline',
        onClick: () => navigateTo(`/plan/${base.value}/${res.period}`)
      }],
    })
    transferOpen.value = false
    await refresh()
  } catch (e: any) {
    toast.add({title: 'Не удалось', description: e?.data?.message, color: 'error'})
  }
}

function onAction(task: PlanTaskItem, action: PlanAction) {
  if (!task?.id || !action?.kind) return
  if (action.kind === 'delete') return onDeleted(task)
  if (action.kind === 'status') return setStatus(task, action.status)
  if (action.to === 'next') return transfer(task, action.kind)
  transferTask.value = task
  transferKind.value = action.kind
  transferOpen.value = true
}

function focusAdd() {
  nextTick(() => list.value?.focusAdd())
}

onMounted(focusAdd)
watch([base, period, fullscreen], focusAdd)

// ── Быстрое добавление ──
async function quickAdd(title: string) {
  try {
    await api('/api/plan', {method: 'POST', body: {scope: scope.value, period: period.value, title}})
    await refresh()
  } catch (e: any) {
    toast.add({title: 'Не удалось добавить', description: e?.data?.message, color: 'error'})
  }
}

// ── Удаление — в «Удалённые», «Отменить» в сообщении возвращает ──
const taskDelete = useSoftDelete('tasks', () => refresh())

function onDeleted(task: PlanTaskItem) {
  taskDelete.remove([task.id], task.title)
}

// ── Горячие клавиши (по физической клавише — работают в любой раскладке) ──
const helpOpen = ref(false)

function goScope(next: PlanScopeKey) {
  if (next === scope.value && !weekly.value) return
  const today = todayISO()
  const anchor = periodKeyFor(scope.value, today) === period.value
      ? today
      : periodStartISO(scope.value, period.value)
  navigateTo(`/plan/${next}/${periodKeyFor(next, anchor)}`)
}

function goWeekly() {
  if (!weekly.value) navigateTo(`/plan/weekly/${periodKeyFor('week', todayISO())}`)
}

const HOTKEYS: Record<string, () => void> = {
  KeyU: () => goScope('year'),            // Г
  KeyV: () => goScope('month'),           // М
  KeyY: () => goScope('week'),            // Н — список недели
  KeyT: () => goWeekly(),                 // Е — «Еженедельный» (сетка)
  KeyW: () => navigateTo('/goals'),       // Ц — «Цели»
  KeyL: () => goScope('day'),             // Д
  ArrowLeft: () => navigateTo(`/plan/${base.value}/${shiftPeriod(scope.value, period.value, -1)}`),
  ArrowRight: () => navigateTo(`/plan/${base.value}/${shiftPeriod(scope.value, period.value, 1)}`),
  KeyC: () => navigateTo(`/plan/${base.value}/${periodKeyFor(scope.value, todayISO())}`),   // С
  KeyB: () => (reviewMode.value = !weekly.value),  // И (в «Еженедельном» итогов нет)
  KeyN: () => list.value?.focusAdd(),     // Т
  KeyF: () => (fullscreen.value = !fullscreen.value),   // А
  Slash: () => (helpOpen.value = true),   // ?
}

function onHotkey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
  if (transferOpen.value || reviewMode.value || helpOpen.value) return
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"], [role="menu"], [role="listbox"]')) return
  const action = HOTKEYS[e.code]
  if (!action) return
  e.preventDefault()
  action()
}

useEventListener(import.meta.client ? window : undefined, 'keydown', onHotkey)
</script>

<template>
  <div class="contents">
    <Page>
        <!-- В режиме итогов шапка плана скрыта: переходить некуда, пока итоги не завершены -->
        <template v-if="!reviewMode" #header>
          <PlanHeader
              :scope="scope"
              :base="base"
              :no-review="weekly"
              :period="period"
              :fullscreen="fullscreen"
              :tasks="tasks"
              :reviewed="reviewed"
              :reviewing="reviewMode"
              @toggle-fullscreen="fullscreen = !fullscreen"
              @review="toggleReview"
          >
            <template #right>
              <TrashButton kind="tasks" @changed="refresh()"/>
            </template>
          </PlanHeader>
        </template>

        <p v-if="error" class="text-muted">{{ error.data?.message || 'Не удалось загрузить план' }}</p>

        <PlanReviewPanel
            v-else-if="reviewMode"
            :tasks="tasks"
            :scope="scope"
            :period="period"
            :week-view="isWeekPlan ? 'plan' : 'list'"
            @close="reviewMode = false"
            @applied="onReviewApplied"
            @dirty="v => (reviewDirty = v)"
        />

        <template v-else>
          <PlanWeekGrid
              v-if="isWeekPlan"
              ref="list"
              :period="period"
              :tasks="gridTasks"
              :pending="status === 'pending'"
              :busy="transferOpen"
              @rename="renameTask"
              @create="createWeekTask"
              @action="onAction"
              @place="placeTask"
          />
          <!-- Список задач (день, месяц, годы, «Список» недели): название правится прямо в строке -->
          <StatusList
              v-else
              ref="list"
              :items="listTasks"
              collapse-key="plan-done-collapsed"
              add-placeholder="Новая задача — Enter, чтобы добавить"
              empty-text="Задач на этот период пока нет."
              :pending="status === 'pending'"
              @add="quickAdd"
              @rename="renameTask"
              @status="setStatus"
              @reorder="reorder"
          >
            <template #menu="{ item }">
              <PlanTaskMenu :task="item" :scope="scope" @action="a => onAction(item, a)"/>
            </template>
          </StatusList>
        </template>

        <PlanTransferModal
            v-model:open="transferOpen"
            :task="transferTask"
            :kind="transferKind"
            :scope="scope"
            :period="period"
            @confirm="target => transferTask && transfer(transferTask, transferKind, target)"
        />

        <PlanHotkeysModal v-model:open="helpOpen"/>
    </Page>
  </div>
</template>