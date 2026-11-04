<script setup lang="ts">
import type {PlanAction, PlanStatus, PlanTaskItem} from '~~/shared/types/plan'
import type {PlanScopeKey} from '~~/shared/utils/planDates'
import {NEXT_LABEL} from '~~/shared/utils/planTasks'

// Меню ⋮ задачи. week — задача плана недели (карточка на сетке):
// «Выполнено», «Частично», | «Копировать на дату…», | «Удалить». Значков ✓ ½ на карточке нет — статус здесь.
// compact — маленькая кнопка для карточки высотой в одну ячейку сетки
const props = withDefaults(defineProps<{
  task: PlanTaskItem
  scope: PlanScopeKey
  size?: 'xs' | 'sm'
  week?: boolean
  compact?: boolean
}>(), {size: 'sm', week: false, compact: false})
const emit = defineEmits<{ action: [action: PlanAction]; openChange: [open: boolean] }>()

// Действие запоминаем и выполняем только после того, как меню закрылось:
// иначе родитель (превью, окно) может удалить меню прямо во время его закрытия
let pending: PlanAction | null = null

function pick(action: PlanAction) {
  pending = action
}

// compact (карточка недели): кнопка видна, пока на ней фокус. Закрытое меню возвращает фокус на кнопку —
// если меню закрыли мышью, этот фокус снимаем, иначе ⋮ висит до клика в пустом месте. С клавиатуры фокус остаётся
const trigger = ref<HTMLButtonElement | null>(null)
let closedAt = 0
let byPointer = false     // последнее действие — мышью (а не клавиатурой)

if (props.compact && import.meta.client) {
  useEventListener(window, 'pointerdown', () => (byPointer = true), {capture: true})
  useEventListener(window, 'keydown', () => (byPointer = false), {capture: true})
}

function onTriggerFocus() {
  if (props.compact && byPointer && Date.now() - closedAt < 1000) trigger.value?.blur()
}

function dropFocus() {
  if (byPointer && document.activeElement === trigger.value) trigger.value?.blur()
}

function onOpenChange(open: boolean) {
  emit('openChange', open)
  if (!open && props.compact) {
    closedAt = Date.now()
    setTimeout(dropFocus, 0)       // на случай, если фокус вернулся раньше, чем пришло закрытие
  }
  if (!open && pending) {
    const action = pending
    pending = null
    setTimeout(() => emit('action', action), 0)
  }
}

const remove = [{label: 'Удалить', icon: 'i-lucide-trash-2', onSelect: () => pick({kind: 'delete'})}]
const copyToDate = {label: 'Копировать на дату…', icon: 'i-lucide-calendar-plus', onSelect: () => pick({kind: 'copy', to: 'date'})}

// Отметка статуса: повторный выбор снимает её (как у ✓ ½ в списках)
function statusItem(status: PlanStatus, label: string) {
  return {
    type: 'checkbox' as const,
    label,
    checked: props.task.status === status,
    disabled: !!props.task.movedAt,
    onSelect: () => pick({kind: 'status', status}),
  }
}

const items = computed(() => {
  if (props.week) {
    return [
      [statusItem('DONE', 'Выполнено'), statusItem('PARTIAL', 'Частично')],
      [copyToDate],
      remove,
    ]
  }
  const next = NEXT_LABEL[props.scope]
  const copy = [
    {label: `Копировать ${next}`, icon: 'i-lucide-copy', onSelect: () => pick({kind: 'copy', to: 'next'})},
    copyToDate,
  ]
  // Перенос убран (2.0) — только копия. Удаление — последним пунктом, отдельной группой (в «Удалённые»)
  return [copy, remove]
})
</script>

<template>
  <span class="shrink-0 flex" @click.stop @pointerdown.stop @keydown.enter.stop>
    <UDropdownMenu
        :items="items"
        :content="{ align: 'end' }"
        @update:open="onOpenChange"
    >
      <button
          v-if="compact"
          ref="trigger"
          type="button"
          @focus="onTriggerFocus"
          class="flex items-center justify-center size-6 rounded-xs text-dimmed hover:text-highlighted hover:bg-elevated"
          aria-label="Действия с задачей"
      >
        <UIcon name="i-lucide-ellipsis-vertical" class="size-4"/>
      </button>
      <UButton
          v-else
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="ghost"
          :size="size"
          aria-label="Действия с задачей"
      />
    </UDropdownMenu>
  </span>
</template>
