<script setup lang="ts">
import {MONTHS, pad} from '~~/shared/utils/planDates'

const props = defineProps<{ year: number; marks?: string[] }>()
const marked = computed(() => new Set(props.marks ?? []))
const months = computed(() => MONTHS.map((name, index) => ({
  key: `${props.year}-${pad(index + 1)}`,
  label: `${name} ${props.year}`,
})))
</script>

<template>
  <div>
    <p class="mb-2 text-sm text-toned">Месяцы {{ year }} года</p>
    <div class="flex flex-col">
      <template v-for="(month, index) in months" :key="month.key">
        <PlanPeriodListItem
            :label="month.label"
            :to="`/plan/month/${month.key}`"
            :has-tasks="marked.has(month.key)"
        />
        <div v-if="index < months.length - 1" class="h-px bg-[var(--ui-border-muted)]" aria-hidden="true"/>
      </template>
    </div>
  </div>
</template>
