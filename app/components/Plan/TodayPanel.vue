<script setup lang="ts">
import {useNow} from '@vueuse/core'
import type {PlanStatus, PlanTaskItem} from '~~/shared/types/plan'
import {MONTHS_GEN, WEEKDAYS, minToTime, mondayOf, parseISO, todayISO} from '~~/shared/utils/planDates'
import {displayOrder, percentOf, planStats} from '~~/shared/utils/planTasks'

const api = useApi()
const toast = useToast()

interface TodayResponse {
  enabled: boolean
  day?: PlanTaskItem[]
  plan?: PlanTaskItem[]
}

// «Сегодня» — по часам пользователя, поэтому загружаем только в браузере
const today = todayISO()
const {data, refresh} = useFetch<TodayResponse>('/api/plan/today', {
  query: {date: today},
  server: false,
  lazy: true,
})

const enabled = computed(() => !!data.value?.enabled)
const dayTasks = computed(() => data.value?.day ?? [])
const planTasks = computed(() => data.value?.plan ?? [])

const dateTitle = computed(() => {
  const d = parseISO(today)
  return `${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]}, ${WEEKDAYS[d.getUTCDay()]}`
})

// ── Прогресс: день и план вместе ──
const stats = computed(() => planStats([...dayTasks.value, ...planTasks.value]))
const donePct = computed(() => percentOf(stats.value.done, stats.value.total))
const partialPct = computed(() => percentOf(stats.value.partial, stats.value.total))

// ── Области ──
const doneCollapsed = useCookie<boolean>('plan-today-done-collapsed', {
  default: () => false,
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})

const dayOpen = computed(() => displayOrder(dayTasks.value).filter(t => t.status !== 'DONE'))
const dayDone = computed(() => dayTasks.value.filter(t => t.status === 'DONE'))
const planOpen = computed(() => planTasks.value.filter(t => t.status !== 'DONE'))
const planDone = computed(() => planTasks.value.filter(t => t.status === 'DONE'))

// ── Время: текущая задача и прошедшие ──
const now = useNow({interval: 60_000})
const nowMin = computed(() => now.value.getHours() * 60 + now.value.getMinutes())
// План недели (2.0): у задачи только начало. «Сейчас» — последняя начавшаяся задача (не дольше часа назад);
// прошедшие — начавшиеся раньше неё
const NOW_SPAN_MIN = 60
const currentTask = computed(() => {
  let best: PlanTaskItem | null = null
  for (const t of planTasks.value) {
    if (t.startMin! <= nowMin.value && (!best || t.startMin! > best.startMin!)) best = t
  }
  return best && nowMin.value - best.startMin! < NOW_SPAN_MIN ? best : null
})
const isNow = (t: PlanTaskItem) => t.id === currentTask.value?.id
const isPast = (t: PlanTaskItem) =>
    currentTask.value ? t.startMin! < currentTask.value.startMin! : t.startMin! + NOW_SPAN_MIN <= nowMin.value
const timeLabel = (t: PlanTaskItem) => minToTime(t.startMin)

// ── Действия ──
async function setStatus(task: PlanTaskItem, next: PlanStatus) {
  const value: PlanStatus = task.status === next ? 'TODO' : next
  try {
    await api(`/api/plan/${task.id}`, {method: 'PATCH', body: {status: value}})
    await refresh()
  } catch (e: any) {
    toast.add({title: 'Не удалось изменить статус', description: e?.data?.message, color: 'error'})
  }
}

const draft = ref('')

async function add() {
  const title = draft.value.trim()
  if (!title) return
  try {
    await api('/api/plan', {method: 'POST', body: {scope: 'day', period: today, title}})
    draft.value = ''
    await refresh()
  } catch (e: any) {
    toast.add({title: 'Не удалось добавить', description: e?.data?.message, color: 'error'})
  }
}

function openTask(task: PlanTaskItem) {
  if (task.scope === 'WEEK') return navigateTo(`/plan/weekly/${mondayOf(today)}`)   // сетка недели
  return navigateTo(`/plan/day/${today}`)
}

const ROW = `flex items-center gap-3 rounded-sm ring ring-inset ring-default px-2 h-10 cursor-pointer
  transition-shadow hover:ring-2 hover:ring-inverted`
const rowTone = (t: PlanTaskItem) => (t.status === 'TODO' ? 'bg-white/70 text-default' : 'bg-white/40 text-dimmed')
</script>

<template>
  <SectionPanel v-if="enabled" title="Сегодня">
    <template #actions>
      <UButton label="Открыть план" size="sm" :to="`/plan/day/${today}`"/>
    </template>

    <div class="space-y-3">
      <!-- Дата и прогресс -->
      <div class="flex items-center gap-4">
        <span class="text-sm text-toned">{{ dateTitle }}</span>
        <div v-if="stats.total" class="flex-1 max-w-[340px] ms-auto">
          <div class="flex justify-between gap-2 text-[11px] tabular-nums text-dimmed">
            <span>
              {{ stats.done }} из {{ stats.total }} выполнено
              <template v-if="stats.partial"> · ½ {{ stats.partial }}</template>
            </span>
            <span class="font-medium">{{ donePct }}%</span>
          </div>
          <div class="h-1 mt-0.5 rounded-full bg-elevated overflow-hidden flex">
            <div class="bg-inverted transition-all" :style="{ width: `${donePct}%` }"/>
            <div class="bg-inverted/40 transition-all" :style="{ width: `${partialPct}%` }"/>
          </div>
        </div>
      </div>

      <!-- День: добавление и список -->
      <div class="space-y-1.5">
        <USeparator :label="`День · ${dayOpen.length}`" :ui="{ label: 'text-xs text-dimmed' }"/>
        <UInput
            v-model="draft"
            icon="i-lucide-plus"
            placeholder="Добавить задачу на сегодня"
            class="w-full"
            :ui="{ base: 'h-9' }"
            @keydown.enter.prevent="add"
            @keydown.esc.prevent="draft = ''"
        />

        <div v-for="t in dayOpen" :key="t.id" :class="[ROW, rowTone(t)]" @click="openTask(t)">
          <span class="flex-1 min-w-0 truncate">{{ t.title }}</span>
          <span class="flex" @click.stop>
            <PlanStatusIcons :status="t.status" @set="s => setStatus(t, s)"/>
          </span>
        </div>

        <template v-if="dayDone.length">
          <USeparator class="pt-2">
            <button
                type="button"
                class="flex items-center gap-1 text-xs text-dimmed hover:text-toned"
                @click="doneCollapsed = !doneCollapsed"
            >
              Выполнено · {{ dayDone.length }}
              <UIcon :name="doneCollapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'" class="size-3.5"/>
            </button>
          </USeparator>
          <template v-if="!doneCollapsed">
            <div v-for="t in dayDone" :key="t.id" :class="[ROW, rowTone(t)]" @click="openTask(t)">
              <span class="flex-1 min-w-0 truncate">{{ t.title }}</span>
              <span class="flex" @click.stop>
                <PlanStatusIcons :status="t.status" @set="s => setStatus(t, s)"/>
              </span>
            </div>
          </template>
        </template>
      </div>

      <!-- Задачи недели на сегодня: только если есть -->
      <div v-if="planTasks.length" class="space-y-1.5 pt-2">
        <USeparator :label="`Неделя · ${planOpen.length}`" :ui="{ label: 'text-xs text-dimmed' }"/>

        <div
            v-for="t in planOpen"
            :key="t.id"
            :class="[ROW, rowTone(t), isPast(t) && 'opacity-60', isNow(t) && 'ring-2 ring-inverted']"
            @click="openTask(t)"
        >
          <span class="w-10 shrink-0 text-xs tabular-nums text-toned">{{ timeLabel(t) }}</span>
          <span class="flex-1 min-w-0 truncate">{{ t.title }}</span>
          <span v-if="isNow(t)" class="text-[11px] text-highlighted shrink-0">сейчас</span>
          <span class="flex" @click.stop>
            <PlanStatusIcons :status="t.status" @set="s => setStatus(t, s)"/>
          </span>
        </div>

        <template v-if="planDone.length">
          <USeparator class="pt-2">
            <button
                type="button"
                class="flex items-center gap-1 text-xs text-dimmed hover:text-toned"
                @click="doneCollapsed = !doneCollapsed"
            >
              Выполнено · {{ planDone.length }}
              <UIcon :name="doneCollapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'" class="size-3.5"/>
            </button>
          </USeparator>
          <template v-if="!doneCollapsed">
            <div v-for="t in planDone" :key="t.id" :class="[ROW, rowTone(t)]" @click="openTask(t)">
              <span class="w-10 shrink-0 text-xs tabular-nums">{{ timeLabel(t) }}</span>
              <span class="flex-1 min-w-0 truncate">{{ t.title }}</span>
              <span class="flex" @click.stop>
                <PlanStatusIcons :status="t.status" @set="s => setStatus(t, s)"/>
              </span>
            </div>
          </template>
        </template>
      </div>
    </div>
  </SectionPanel>
</template>