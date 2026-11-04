<script setup lang="ts">
import type {PlanTaskItem} from '~~/shared/types/plan'
import {periodStartISO, type PlanScopeKey} from '~~/shared/utils/planDates'

const props = defineProps<{
  task: PlanTaskItem | null
  kind: 'move' | 'copy'
  scope: PlanScopeKey
  period: string
}>()
const open = defineModel<boolean>('open', {default: false})
const emit = defineEmits<{ confirm: [target: { period?: string; day?: string }] }>()

const startISO = computed(() => props.task?.day ?? periodStartISO(props.scope, props.period))

// Задача плана недели переносится на конкретный день, задача списка — на неделю
const isTimed = computed(() => props.scope === 'week' && !!props.task?.day)

function pickDate(iso: string) {
  emit('confirm', props.scope === 'week' ? {day: iso} : {period: iso})
}
</script>

<template>
  <UModal
      v-model:open="open"
      :title="kind === 'move' ? 'Перенести на…' : 'Копировать на…'"
      :description="task?.title"
  >
    <template #body>
      <div class="flex flex-col items-center gap-2">
        <PlanMiniCalendar
            v-if="scope === 'day' || isTimed"
            :selected="startISO"
            mode="day"
            @select="pickDate"
        />
        <PlanPeriodPicker
            v-else
            :scope="scope"
            :period="period"
            @select="key => emit('confirm', { period: key })"
        />
        <p v-if="isTimed" class="text-xs text-dimmed">Время сохранится; если оно занято — ближайшее свободное после него.</p>
      </div>
    </template>
  </UModal>
</template>