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
    <div class="flex flex-col gap-1.5">
      <PlanPeriodListItem
          v-for="month in months"
          :key="month.key"
          :label="month.label"
          :to="`/plan/month/${month.key}`"
          :has-tasks="marked.has(month.key)"
      />
    </div>
  </div>
</template>
