<script setup lang="ts">
defineProps<{ active: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <UTooltip :text="active ? 'Убрать из избранного' : 'Добавить в избранное'">
    <UButton
        :icon="active ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
        :ui="{ leadingIcon: active ? 'text-amber-500!' : 'text-dimmed!' }"
        :aria-label="active ? 'Убрать из избранного' : 'Добавить в избранное'"
        size="sm"
        @click.prevent.stop="emit('toggle')"
    />
  </UTooltip>
</template>