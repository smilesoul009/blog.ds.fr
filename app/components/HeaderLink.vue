<script setup lang="ts">
// Текстовая ссылка в шапке страницы (слоты #left / #right у Header): значок + подпись, без рамки кнопки
defineProps<{ to: string; label: string; icon?: string }>()
</script>

<template>
  <NuxtLink
      :to="to"
      class="inline-flex items-center gap-1.5 h-9 px-1 text-sm text-toned rounded-xs whitespace-nowrap
             hover:text-highlighted hover:underline underline-offset-4
             focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted"
  >
    <UIcon v-if="icon" :name="icon" class="size-4 shrink-0"/>
    <span>{{ label }}</span>
  </NuxtLink>
</template>
