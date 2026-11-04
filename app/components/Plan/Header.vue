<script setup lang="ts">
import type {PlanTaskItem} from '~~/shared/types/plan'
import {
  periodKeyFor,
  periodStartISO,
  periodTitle,
  type PlanScopeKey,
  shiftPeriod,
  todayISO,
} from '~~/shared/utils/planDates'
import {percentOf, planStats} from '~~/shared/utils/planTasks'

// Шапка плана: период со стрелками, прогресс, итоги, «Удалённые» (слот #right), «Сегодня», полный экран.
// Выбор года и вида периода — в боковом меню раздела (PlanSectionMenu) и в календаре года (/plan/time/…), не здесь
const props = defineProps<{
  scope: PlanScopeKey
  period: string
  base?: string           // первая часть адреса: вид периода или «weekly» (сетка недели); по умолчанию — scope
  fullscreen?: boolean
  noReview?: boolean      // без прогресса и итогов («Еженедельный»: итоги недели — в «Неделе»)
  tasks: PlanTaskItem[]
  reviewed?: boolean
  reviewing?: boolean
}>()
const emit = defineEmits<{ toggleFullscreen: []; review: [] }>()

const pickerOpen = ref(false)
const today = ref(todayISO())
onMounted(() => (today.value = todayISO()))

const currentKey = computed(() => periodKeyFor(props.scope, today.value))
// Период уже начался — итоги по нему можно подводить
const started = computed(() => periodStartISO(props.scope, props.period) <= today.value)

// Значок итогов: ✓ — подведены, ! — период идёт или прошёл, а итогов нет, иначе обычный
const reviewIcon = computed(() => props.reviewed
    ? 'i-lucide-circle-check'
    : started.value ? 'i-lucide-circle-alert' : 'i-lucide-clipboard-list')
const reviewHint = computed(() => props.reviewing
    ? 'Выйти из итогов'
    : props.reviewed ? 'Итоги подведены' : started.value ? 'Итоги не подведены' : 'Подвести итоги')
const isCurrent = computed(() => currentKey.value === props.period)

const stats = computed(() => planStats(props.tasks))
const donePct = computed(() => percentOf(stats.value.done, stats.value.total))
const partialPct = computed(() => percentOf(stats.value.partial, stats.value.total))

function go(key: string) {
  pickerOpen.value = false
  return navigateTo(`/plan/${props.base ?? props.scope}/${key}`)
}
</script>

<template>
  <div class="@container">
    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div/>

      <!-- Заголовок и прогресс -->
      <div class="flex flex-col items-center">
        <div class="flex items-center gap-1">
          <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              class="@max-[900px]:px-1"
              variant="ghost"
              aria-label="Предыдущий"
              @click="go(shiftPeriod(scope, period, -1))"
          />

          <UPopover v-model:open="pickerOpen" :content="{ align: 'center' }">
            <button
                type="button"
                class="text-xl @max-[900px]:text-base font-semibold px-3 @max-[900px]:px-1.5 h-9 rounded-xs
                       hover:bg-elevated text-center whitespace-nowrap
                       min-w-[300px] @max-[1120px]:min-w-[240px] @max-[900px]:min-w-0"
                title="Выбрать период"
            >
              {{ periodTitle(scope, period) }}
            </button>
            <template #content>
              <PlanPeriodPicker :scope="scope" :period="period" @select="key => go(key)"/>
            </template>
          </UPopover>

          <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              class="@max-[900px]:px-1"
              aria-label="Следующий"
              @click="go(shiftPeriod(scope, period, 1))"
          />
        </div>

        <!-- Прогресс и значок итогов: значок виден всегда, в том числе на пустом периоде -->
        <div v-if="!noReview" class="flex items-center gap-1 w-full max-w-[372px] pt-0.5">
        <button
            type="button"
            class="group flex-1 min-w-0 px-3"
            :class="!stats.total && 'invisible pointer-events-none'"
            :tabindex="stats.total ? 0 : -1"
            title="Подвести итоги"
            @click="emit('review')"
        >
          <div class="flex justify-between gap-2 text-[11px] tabular-nums text-dimmed group-hover:text-toned">
            <span class="truncate">
              {{ stats.done }} из {{ stats.total }} выполнено
              <template v-if="stats.partial"> · ½ {{ stats.partial }}</template>
              <template v-if="stats.moved"> · → {{ stats.moved }}</template>
            </span>
            <span class="font-medium">{{ donePct }}%</span>
          </div>
          <div class="h-1 mt-0.5 rounded-full bg-elevated overflow-hidden flex">
            <div class="bg-inverted transition-all" :style="{ width: `${donePct}%` }"/>
            <div class="bg-inverted/40 transition-all" :style="{ width: `${partialPct}%` }"/>
          </div>
        </button>

        <UTooltip :text="reviewHint">
          <UButton
              :icon="reviewIcon"
              :aria-label="reviewHint"
              size="sm"
              color="neutral"
              :variant="reviewing ? 'solid' : 'ghost'"
              :class="!reviewing && (reviewed ? 'text-success' : started ? 'text-warning' : 'text-dimmed hover:text-toned')"
              @click="emit('review')"
          />
        </UTooltip>
        </div>
      </div>

      <!-- «Удалённые», Сегодня, полный экран -->
      <div class="flex justify-end items-center gap-1.5 min-w-0">
        <!-- Дополнительно от страницы (значок «Удалённые») -->
        <slot name="right"/>

        <UTooltip text="Сегодня">
          <UButton
              icon="i-lucide-house"
              aria-label="Сегодня"
              color="neutral"
              variant="outline"
              :disabled="isCurrent"
              @click="go(currentKey)"
          />
        </UTooltip>

        <UTooltip :text="fullscreen ? 'Свернуть' : 'Развернуть'">
          <UButton
              :icon="fullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
              :aria-label="fullscreen ? 'Свернуть' : 'Развернуть'"
              color="neutral"
              variant="outline"
              @click="emit('toggleFullscreen')"
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>