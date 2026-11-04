<script setup lang="ts">
import {useSortable} from '@vueuse/integrations/useSortable'
import type {GoalListItem} from '~~/shared/types/goal'
import type {PlanStatus} from '~~/shared/types/plan'
import {goalPercent} from '~~/shared/utils/goals'
import {STATUS_LABEL, STATUS_ORDER} from '~~/shared/utils/planTasks'

// Цели: список с прогрессом и сроками, открытая цель — в окне (адрес ?open=id)
const api = useApi()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const {data, error, refresh} = await useFetch<{ items: GoalListItem[] }>('/api/goals')

// Удаление — в «Удалённые» (значок справа в шапке), «Отменить» в сообщении возвращает
const goalDelete = useSoftDelete('goals', () => refresh())

const goals = computed(() => data.value?.items ?? [])

// ── Быстрое добавление ──
const draft = ref('')

async function addGoal() {
  const title = draft.value.trim()
  if (!title) return
  try {
    await api('/api/goals', {method: 'POST', body: {title}})
    draft.value = ''
    await refresh()
  } catch (e: any) {
    toast.add({title: 'Не удалось добавить цель', description: e?.data?.message, color: 'error'})
  }
}

// ── Области по проценту: 0% — не выполнено, 1–99% — частично, 100% — выполнено ──
function areaOf(g: GoalListItem): PlanStatus {
  const pct = goalPercent(g)
  if (g.total && pct === 100) return 'DONE'
  if (pct > 0) return 'PARTIAL'
  return 'TODO'
}

const doneCollapsed = useCookie<boolean>('goals-done-collapsed', {
  default: () => false, maxAge: 60 * 60 * 24 * 365, sameSite: 'lax',
})

// У каждой области свой список и своё перетаскивание: область задаёт прогресс, а не порядок
const areas = reactive<Record<PlanStatus, GoalListItem[]>>({TODO: [], PARTIAL: [], DONE: []})
watch(goals, (v) => {
  for (const s of STATUS_ORDER) areas[s] = v.filter(g => areaOf(g) === s)
}, {immediate: true})

// Сквозной номер цели по всем областям — как у этапов и задач плана
const numberOf = computed(() => new Map(STATUS_ORDER.flatMap(s => areas[s]).map((g, i) => [g.id, i + 1])))

const areaEls = {TODO: ref<HTMLElement | null>(null), PARTIAL: ref<HTMLElement | null>(null), DONE: ref<HTMLElement | null>(null)}

async function saveOrder() {
  const ids = STATUS_ORDER.flatMap(s => areas[s].map(g => g.id))
  try {
    await api('/api/goals/reorder', {method: 'POST', body: {ids}})
  } catch (err: any) {
    toast.add({title: 'Не удалось изменить порядок', description: err?.data?.message, color: 'error'})
  }
  await refresh()
}

for (const s of STATUS_ORDER) {
  useSortable(areaEls[s], toRef(areas, s), {
    handle: '.drag-handle',
    animation: 150,
    forceFallback: true,
    fallbackTolerance: 3,
    ghostClass: 'opacity-40',
    chosenClass: 'shadow-md',
    onEnd: (e: any) => {
      if (e.oldIndex !== e.newIndex) nextTick(saveOrder)
    },
  })
}

// ── Окно цели ──
const openId = computed(() => (typeof route.query.open === 'string' ? route.query.open : null))
const modalOpen = computed({
  get: () => !!openId.value,
  set: (v: boolean) => {
    if (!v) router.replace({query: {...route.query, open: undefined}})
  },
})

function openGoal(id: string) {
  router.push({query: {...route.query, open: id}})
}

// ── Переименование прямо в строке (карандаш или F2) ──
type TitleRef = { start: () => void }
const titles = new Map<string, TitleRef>()

function setTitle(id: string, el: unknown) {
  if (el) titles.set(id, el as TitleRef)
  else titles.delete(id)
}

async function renameGoal(g: GoalListItem, title: string) {
  try {
    await api(`/api/goals/${g.id}`, {method: 'PATCH', body: {title}})
  } catch (e: any) {
    toast.add({title: 'Не удалось переименовать', description: e?.data?.message, color: 'error'})
  }
  await refresh()
}

async function copyGoal(id: string) {
  try {
    const copy = await api<{ id: string; title: string }>(`/api/goals/${id}/copy`, {method: 'POST'})
    await onCopied(copy)
  } catch (e: any) {
    toast.add({title: 'Не удалось скопировать', description: e?.data?.message, color: 'error'})
  }
}

async function onCopied(copy: { id: string; title: string }) {
  await refresh()
  toast.add({
    title: 'Цель скопирована',
    description: copy.title,
    color: 'success',
    actions: [{label: 'Открыть', color: 'neutral', variant: 'outline', onClick: () => openGoal(copy.id)}],
  })
}

function removeGoal(id: string) {
  goalDelete.remove([id], goals.value.find(g => g.id === id)?.title)
}

function menuFor(g: GoalListItem) {
  return [[
    {label: 'Открыть', icon: 'i-lucide-square-arrow-out-up-right', onSelect: () => openGoal(g.id)},
    {label: 'Копировать', icon: 'i-lucide-copy', onSelect: () => copyGoal(g.id)},
    {label: 'Удалить', icon: 'i-lucide-trash-2', onSelect: () => removeGoal(g.id)},
  ]]
}

const finished = (g: GoalListItem) => g.total > 0 && g.done === g.total
</script>

<template>
  <Page>
    <template #header>
      <Header>
        Цели
        <template #right>
          <TrashButton kind="goals" @changed="refresh()"/>
        </template>
      </Header>
    </template>

    <p v-if="error" class="text-muted">{{ error.data?.message || 'Не удалось загрузить цели' }}</p>

    <div v-else class="space-y-1.5">
      <UInput
          v-model="draft"
          icon="i-lucide-plus"
          placeholder="Новая цель — Enter, чтобы добавить"
          class="w-full"
          :ui="{ base: 'h-9' }"
          @keydown.enter.prevent="addGoal"
          @keydown.esc.prevent="draft = ''"
      />

      <p v-if="!goals.length" class="text-sm text-dimmed px-1 py-4">
        Целей пока нет. Добавьте первую — например, «Подготовка к семинару».
      </p>

      <!-- Не v-if: списки для перетаскивания должны существовать с самого начала -->
      <div v-show="goals.length" class="space-y-1.5">
        <div v-for="status in STATUS_ORDER" :key="status" class="space-y-1.5">
          <div class="pt-2 pb-0.5 select-none">
            <USeparator
                v-if="status !== 'DONE'"
                :ui="{ label: 'text-xs text-dimmed' }"
                :label="`${STATUS_LABEL[status]} · ${areas[status].length}`"
            />
            <USeparator v-else>
              <button
                  type="button"
                  class="flex items-center gap-1 text-xs text-dimmed hover:text-toned"
                  @click="doneCollapsed = !doneCollapsed"
              >
                {{ STATUS_LABEL.DONE }} · {{ areas.DONE.length }}
                <UIcon :name="doneCollapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'" class="size-3.5"/>
              </button>
            </USeparator>
          </div>

          <div
              v-show="!(status === 'DONE' && doneCollapsed)"
              :ref="el => (areaEls[status].value = el as HTMLElement | null)"
              class="space-y-1.5"
          >
        <!-- Строка цели: название правится по клику (как у задач); этапы — по прогрессу («изменить») или ⋮ → «Открыть» -->
        <div
            v-for="g in areas[status]"
            :key="g.id"
            tabindex="0"
            class="group flex items-center gap-3 rounded-xs ring ring-inset ring-default ps-1 pe-2 h-14 bg-white/70
                   transition-shadow hover:ring-2 hover:ring-inverted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted"
            @keydown.enter.self.prevent="titles.get(g.id)?.start()"
            @keydown.f2.self.prevent="titles.get(g.id)?.start()"
        >
          <span
              class="drag-handle shrink-0 flex items-center h-full px-1 cursor-grab active:cursor-grabbing text-dimmed hover:text-toned"
              title="Перетащить"
          >
            <UIcon name="i-lucide-grip-vertical" class="size-4"/>
          </span>
          <span class="w-3 text-right tabular-nums shrink-0 text-toned">{{ numberOf.get(g.id) }}</span>
          <USeparator orientation="vertical" class="h-6"/>
          <InlineTitle
              :ref="el => setTitle(g.id, el)"
              :title="g.title"
              class="text-highlighted"
              @save="t => renameGoal(g, t)"
          />
          <GoalDue :date="g.dueDate" :finished="finished(g)"/>
          <!-- Прогресс — вход в этапы: при наведении между «N из M» и процентом появляется «изменить» -->
          <button
              type="button"
              class="group/progress w-40 shrink-0 rounded-xs px-1 -mx-1 py-1 cursor-pointer hover:bg-elevated/60
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted"
              title="Открыть цель и этапы"
              @click="openGoal(g.id)"
          >
            <GoalProgress :progress="g" action="изменить"/>
          </button>
          <span class="flex">
            <UDropdownMenu :items="menuFor(g)" :content="{ align: 'end' }">
              <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" size="sm" aria-label="Действия с целью"/>
            </UDropdownMenu>
          </span>
        </div>
          </div>
        </div>
      </div>
    </div>

    <GoalModal
        v-model:open="modalOpen"
        :goal-id="openId"
        @changed="refresh()"
        @copied="onCopied"
        @remove="removeGoal"
    />
  </Page>
</template>
