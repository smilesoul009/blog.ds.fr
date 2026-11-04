<script setup lang="ts">
import {addDays, todayISO} from '~~/shared/utils/planDates'
import {dueHint, dueState, DUE_CLASS} from '~~/shared/utils/goals'
import {DAY_SLOT_LABEL, DEFAULT_NOTIFY_SETTINGS} from '~~/shared/constants/notifications'
import type {GoalRemind} from '~~/shared/types/goal'

// Срок: галочка включает поле даты; без галочки срока нет.
// Колокольчик (когда срок есть) — напоминание: по общим настройкам или своё
const model = defineModel<string | null>({default: null})
const remind = defineModel<GoalRemind | null>('remind', {default: null})
const props = defineProps<{ finished?: boolean }>()

const enabled = computed({
  get: () => !!model.value,
  set: (on: boolean) => (model.value = on ? (lastDate.value ?? addDays(todayISO(), 7)) : null),
})

// Помним дату, чтобы выключение-включение галочки её не теряло
const lastDate = ref<string | null>(model.value)
watch(model, v => v && (lastDate.value = v))

// ── Своё напоминание ──
const general = DEFAULT_NOTIFY_SETTINGS.goals
const own = computed(() => !!remind.value)

function setOwn(on: boolean) {
  if (on === own.value) return
  remind.value = on
      ? {daysBefore: general.soon.daysBefore, soonSlot: general.soon.slot, daySlot: general.due.slot}
      : null
}

function patch(part: Partial<GoalRemind>) {
  if (remind.value) remind.value = {...remind.value, ...part}
}

const summary = computed(() => remind.value
    ? `за ${remind.value.daysBefore} дн. (${DAY_SLOT_LABEL[remind.value.soonSlot].toLowerCase()}), `
    + `в день срока (${DAY_SLOT_LABEL[remind.value.daySlot].toLowerCase()})`
    : 'по общим настройкам')
</script>

<template>
  <div class="flex items-center gap-2 text-sm">
    <UCheckbox v-model="enabled" label="Срок"/>
    <UInput
        :model-value="model ?? lastDate ?? ''"
        type="date"
        size="sm"
        class="w-40"
        :disabled="!enabled"
        @update:model-value="v => (model = v ? String(v) : null)"
    />

    <UPopover v-if="model" :content="{ align: 'start' }">
      <UButton
          :icon="own ? 'i-lucide-bell-ring' : 'i-lucide-bell'"
          size="sm"
          color="neutral"
          variant="outline"
          :title="`Напоминание: ${summary}`"
          aria-label="Напоминание о сроке"
      />
      <template #content>
        <div class="w-96 p-3 space-y-3 text-sm">
          <div class="flex gap-1">
            <button type="button" class="plan-scope flex-1" :class="!own && 'nav-tab-active'" @click="setOwn(false)">
              По общим
            </button>
            <button type="button" class="plan-scope flex-1" :class="own && 'nav-tab-active'" @click="setOwn(true)">
              Своё
            </button>
          </div>

          <template v-if="remind">
            <div class="flex items-center gap-2">
              <span class="w-28 shrink-0">Скоро срок</span>
              <span class="text-toned">за</span>
              <UInputNumber
                  :model-value="remind.daysBefore"
                  :min="1"
                  :max="90"
                  size="sm"
                  class="w-24"
                  @update:model-value="v => patch({ daysBefore: Math.min(90, Math.max(1, Number(v) || 1)) })"
              />
              <span class="text-toned">дн.</span>
              <DaySlotPicker
                  :model-value="remind.soonSlot"
                  class="ms-auto"
                  @update:model-value="v => patch({ soonSlot: v })"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-28 shrink-0">В день срока</span>
              <DaySlotPicker
                  :model-value="remind.daySlot"
                  class="ms-auto"
                  @update:model-value="v => patch({ daySlot: v })"
              />
            </div>
            <p class="text-xs text-dimmed">«Просрочено» — по общим настройкам.</p>
          </template>
          <p v-else class="text-xs text-dimmed">
            Как в «Настройки → Уведомления → Сроки целей».
          </p>
        </div>
      </template>
    </UPopover>

    <span v-if="model" class="text-xs" :class="DUE_CLASS[dueState(model, !!props.finished)]">{{ dueHint(model) }}</span>
    <span v-if="model && own" class="text-xs text-dimmed">· своё напоминание</span>
  </div>
</template>
