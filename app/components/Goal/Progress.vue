<script setup lang="ts">
import type {GoalProgress} from '~~/shared/types/goal'
import {goalBar, goalPercent} from '~~/shared/utils/goals'

// «5 из 8 · 69%» и полоска: тёмная часть — выполнено, светлая — частично.
// action — подпись по центру, видна при наведении на родителя с классом group/progress (кнопка «открыть»)
const props = defineProps<{ progress: GoalProgress; action?: string }>()
const bar = computed(() => goalBar(props.progress))
</script>

<template>
  <div class="w-full">
    <div class="flex justify-between gap-2 text-[11px] tabular-nums text-dimmed">
      <span>{{ progress.done }} из {{ progress.total }}</span>
      <span v-if="action" class="text-highlighted opacity-0 group-hover/progress:opacity-100 group-focus-visible/progress:opacity-100">
        {{ action }}
      </span>
      <span class="font-medium">{{ goalPercent(progress) }}%</span>
    </div>
    <div class="h-1 mt-0.5 rounded-full bg-elevated overflow-hidden flex">
      <div class="bg-inverted transition-all" :style="{ width: `${bar.done}%` }"/>
      <div class="bg-inverted/40 transition-all" :style="{ width: `${bar.partial}%` }"/>
    </div>
  </div>
</template>
