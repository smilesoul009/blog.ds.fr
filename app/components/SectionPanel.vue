<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="page-card p-2">
    <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-default">
      <h2 class="font-medium">{{ title }}</h2>
      <slot name="actions" />
    </div>
    <div class="p-4">
      <slot />
    </div>
  </div>
</template>