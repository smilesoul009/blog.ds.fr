<script setup lang="ts">
const view = defineModel<'cards' | 'list'>({ required: true })
</script>

<template>
  <div class="flex items-center gap-1 shrink-0">
    <button
        type="button"
        title="Карточки"
        :class="['reader-toggle', view === 'cards' && 'reader-toggle-active']"
        @click="view = 'cards'"
    >
      <UIcon name="i-lucide-layout-grid" class="size-4"/>
    </button>
    <button
        type="button"
        title="Список"
        :class="['reader-toggle', view === 'list' && 'reader-toggle-active']"
        @click="view = 'list'"
    >
      <UIcon name="i-lucide-list" class="size-4"/>
    </button>
  </div>
</template>