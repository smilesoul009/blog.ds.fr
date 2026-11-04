<script setup lang="ts">
withDefaults(defineProps<{ size?: string }>(), { size: 'h-3/5' })
</script>

<template>
  <div class="absolute inset-0 flex items-center justify-center bg-sub-200">
    <img
        src="/images/emblem.png"
        alt=""
        aria-hidden="true"
        draggable="false"
        :class="size"
        class="w-auto max-w-none aspect-square object-contain opacity-50 select-none pointer-events-none"
    >
  </div>
</template>