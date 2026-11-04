<script setup lang="ts">
import type {PlanStatus} from '~~/shared/types/plan'
import type {GoalItem, GoalRemind, GoalStepItem} from '~~/shared/types/goal'

// Окно цели: шапка (название, описание, срок, прогресс) и этапы — стандартный StatusList
// (название этапа правится прямо в строке, отдельной формы нет)
const props = defineProps<{ goalId: string | null }>()
const open = defineModel<boolean>('open', {default: false})
const emit = defineEmits<{
  changed: []
  copied: [goal: { id: string; title: string }]
  remove: [goalId: string]
}>()

const api = useApi()
const toast = useToast()

const goal = ref<GoalItem | null>(null)
const loading = ref(false)

const steps = computed(() => goal.value?.steps ?? [])
const progress = computed(() => ({
  total: steps.value.length,
  done: steps.value.filter(s => s.status === 'DONE').length,
  partial: steps.value.filter(s => s.status === 'PARTIAL').length,
}))

async function load() {
  if (!props.goalId) return
  loading.value = true
  try {
    goal.value = await api<GoalItem>(`/api/goals/${props.goalId}`)
    head.title = goal.value.title
    head.description = goal.value.description ?? ''
    head.dueDate = goal.value.dueDate
    head.remind = goal.value.remind
  } catch (e: any) {
    toast.add({title: 'Не удалось открыть цель', description: e?.data?.message, color: 'error'})
    open.value = false
  } finally {
    loading.value = false
  }
}

function start() {
  load()
}

watch(open, (v) => {
  if (v) start()
  else goal.value = null
})
// Открыли другую цель, не закрывая окно (например, «Открыть» у копии)
watch(() => props.goalId, (id, old) => {
  if (open.value && id && id !== old) start()
})
// Страница открыта сразу с ?open=id
onMounted(() => open.value && start())

// ── Шапка цели: сохраняется сразу (название и описание — при выходе из поля) ──
const head = reactive<{ title: string; description: string; dueDate: string | null; remind: GoalRemind | null }>({
  title: '', description: '', dueDate: null, remind: null,
})

const sameRemind = (a: GoalRemind | null, b: GoalRemind | null) => JSON.stringify(a) === JSON.stringify(b)

async function saveGoal(patch: Record<string, unknown>) {
  if (!goal.value) return
  try {
    const res = await api<GoalItem>(`/api/goals/${goal.value.id}`, {method: 'PATCH', body: patch})
    goal.value = {...goal.value, title: res.title, description: res.description, dueDate: res.dueDate, remind: res.remind}
    emit('changed')
  } catch (e: any) {
    toast.add({title: 'Не удалось сохранить цель', description: e?.data?.message, color: 'error'})
  }
}

function saveTitle() {
  const title = head.title.trim()
  if (!title) return (head.title = goal.value?.title ?? '')
  if (title !== goal.value?.title) saveGoal({title})
}

function saveDescription() {
  const description = head.description.trim()
  if (description !== (goal.value?.description ?? '')) saveGoal({description: description || null})
}

watch(() => head.dueDate, (v) => {
  if (goal.value && v !== goal.value.dueDate) saveGoal({dueDate: v})
})

watch(() => head.remind, (v) => {
  if (goal.value && !sameRemind(v, goal.value.remind)) saveGoal({remind: v})
})

// ── Этапы: статус, название, порядок, добавление ──
async function setStatus(step: GoalStepItem, next: PlanStatus) {
  const value: PlanStatus = step.status === next ? 'TODO' : next
  try {
    const res = await api<GoalStepItem>(`/api/goals/steps/${step.id}`, {method: 'PATCH', body: {status: value}})
    replaceStep(res)
    emit('changed')
  } catch (e: any) {
    toast.add({title: 'Не удалось изменить статус', description: e?.data?.message, color: 'error'})
  }
}

async function renameStep(step: GoalStepItem, title: string) {
  try {
    const res = await api<GoalStepItem>(`/api/goals/steps/${step.id}`, {method: 'PATCH', body: {title}})
    replaceStep(res)
  } catch (e: any) {
    toast.add({title: 'Не удалось переименовать этап', description: e?.data?.message, color: 'error'})
    await reloadSteps()
  }
}

async function reorder(ids: string[], moved?: { id: string; status: PlanStatus }) {
  if (!goal.value) return
  try {
    await api(`/api/goals/${goal.value.id}/steps/reorder`, {method: 'POST', body: {ids, moved}})
  } catch (e: any) {
    toast.add({title: 'Не удалось изменить порядок', description: e?.data?.message, color: 'error'})
  }
  await reloadSteps()
  emit('changed')
}

async function addStep(title: string) {
  if (!goal.value) return
  try {
    const step = await api<GoalStepItem>(`/api/goals/${goal.value.id}/steps`, {method: 'POST', body: {title}})
    goal.value.steps = [...goal.value.steps, step]
    emit('changed')
  } catch (e: any) {
    toast.add({title: 'Не удалось добавить этап', description: e?.data?.message, color: 'error'})
  }
}

async function reloadSteps() {
  if (!goal.value) return
  const fresh = await api<GoalItem>(`/api/goals/${goal.value.id}`)
  goal.value = {...goal.value, steps: fresh.steps}
}

function replaceStep(step: GoalStepItem) {
  if (!goal.value) return
  goal.value.steps = goal.value.steps.map(s => (s.id === step.id ? step : s))
}

// ── Удаление этапа — в «Удалённые» этой цели (значок у списка этапов), «Отменить» возвращает ──
const stepDelete = useSoftDelete('steps', async () => {
  await reloadSteps()
  emit('changed')
})

async function onTrashChanged() {
  await reloadSteps()
  emit('changed')
}

const stepMenu = (step: GoalStepItem) => [[
  {label: 'Удалить этап', icon: 'i-lucide-trash-2', onSelect: () => stepDelete.remove([step.id], step.title)},
]]

// ── Закрытие ──
function close() {
  open.value = false
}

function onOpenChange(v: boolean) {
  open.value = v
}

// ── Цель: копировать, удалить ──
async function copyGoal() {
  if (!goal.value) return
  try {
    const copy = await api<{ id: string; title: string }>(`/api/goals/${goal.value.id}/copy`, {method: 'POST'})
    emit('copied', copy)
  } catch (e: any) {
    toast.add({title: 'Не удалось скопировать', description: e?.data?.message, color: 'error'})
  }
}

function removeGoal() {
  if (!goal.value) return
  const id = goal.value.id
  open.value = false
  emit('remove', id)
}

const menu = computed(() => [[
  {label: 'Копировать цель', icon: 'i-lucide-copy', onSelect: copyGoal},
  {label: 'Удалить цель', icon: 'i-lucide-trash-2', onSelect: removeGoal},
]])

// Многострочные поля (стандартный UTextarea) растут по высоте вместе с текстом.
// Принимает компонент (из :ref), элемент или событие ввода
function fit(target: unknown) {
  const el = target instanceof Event
      ? target.target
      : (target as { textareaRef?: HTMLTextAreaElement } | null)?.textareaRef ?? target
  if (!(el instanceof HTMLTextAreaElement)) return
  const apply = () => {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  apply()
  requestAnimationFrame(apply)
}
</script>

<template>
  <UModal
      :open="open"
      @update:open="onOpenChange"
      :close="false"
      :ui="{ content: 'sm:max-w-6xl h-[88vh] flex flex-col bg-transparent ring-0 shadow-none' }"
  >
    <template #content>
      <!-- Окно цели собрано из стандартных блоков: Page (рамка, шапка, прокручиваемое содержимое) и StatusList -->
      <Page class="h-full pt-2">
        <template #header>
          <div v-if="goal" class="space-y-2 px-1">
            <!-- Строка 1: название, прогресс, меню, закрыть -->
            <div class="flex items-center gap-4">
              <input
                  v-model="head.title"
                  class="flex-1 min-w-0 bg-transparent text-xl font-semibold text-highlighted outline-none rounded-xs px-1 -mx-1
                         hover:bg-elevated/60 focus:bg-white focus:ring-2 focus:ring-inverted"
                  aria-label="Название цели"
                  @blur="saveTitle"
                  @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
              >
              <div class="w-44 shrink-0">
                <GoalProgress :progress="progress"/>
              </div>
              <UDropdownMenu :items="menu" :content="{ align: 'end' }">
                <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" aria-label="Действия с целью"/>
              </UDropdownMenu>
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Закрыть" @click="close"/>
            </div>

            <!-- Строка 2: описание занимает всё свободное место, срок прижат вправо -->
            <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <UTextarea
                  :ref="fit"
                  v-model="head.description"
                  :rows="2"
                  placeholder="Описание цели"
                  class="w-full"
                  :ui="{ base: 'resize-none overflow-hidden' }"
                  @input="fit"
                  @focusout="saveDescription"
              />
              <GoalDueField
                  v-model="head.dueDate"
                  v-model:remind="head.remind"
                  :finished="progress.total > 0 && progress.done === progress.total"
                  class="justify-self-end pt-1"
              />
            </div>
          </div>
          <p v-else class="text-sm text-dimmed px-1">Загрузка…</p>
        </template>

        <template v-if="goal">
          <!-- Этапы: стандартный список, название правится прямо в строке -->
          <StatusList
              :items="steps"
              collapse-key="goal-done-collapsed"
              add-placeholder="Новый этап — Enter, чтобы добавить"
              empty-text="Этапов пока нет — добавьте первый."
              @add="addStep"
              @rename="renameStep"
              @status="setStatus"
              @reorder="reorder"
          >
            <template #tools>
              <TrashButton kind="steps" :goal-id="goal.id" popover @changed="onTrashChanged"/>
            </template>
            <template #menu="{ item }">
              <span class="flex">
                <UDropdownMenu :items="stepMenu(item)" :content="{ align: 'end' }">
                  <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" size="sm" aria-label="Действия с этапом"/>
                </UDropdownMenu>
              </span>
            </template>
          </StatusList>
        </template>
      </Page>
    </template>
  </UModal>
</template>
