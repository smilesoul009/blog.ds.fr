<script setup lang="ts">
/**
 * Plan / Period list item (Figma 2017:107).
 * Общая строка выбора месяца и недели: точка управляется наличием задач.
 */
withDefaults(defineProps<{
  label: string
  to: string
  type?: 'month' | 'week'
  hasTasks?: boolean
  current?: boolean
}>(), {
  type: 'month',
  hasTasks: false,
  current: false,
})
</script>

<template>
  <NuxtLink
      :to="to"
      class="flex h-12 w-full items-center gap-2 rounded-xs px-5 text-sm font-normal text-default
             border border-[#BDC0C4] bg-[#ECEDEE]
             transition-[filter,box-shadow] hover:brightness-[0.97] focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-500"
  >
    <span class="min-w-0" :class="type === 'week' && 'tracking-[0.6px]'">{{ label }}</span>
    <span
        v-if="hasTasks"
        class="size-[5px] shrink-0 rounded-full bg-[var(--ui-text-toned)]"
        aria-label="Есть задачи"
        title="Есть задачи"
    />
    <UIcon
        v-if="current"
        name="i-lucide-house"
        class="ms-auto size-4 shrink-0 text-toned"
        aria-label="Текущий период"
        title="Текущий период"
    />
  </NuxtLink>
</template>
