<script setup lang="ts">
// Заголовок страницы. Слоты #left и #right — ссылки по краям шапки (отступ 12 px от края), заголовок остаётся строго по центру.
// Наличие слотов проверяем прямо в шаблоне ($slots): computed по useSlots() не реактивен и может «застрять»
</script>

<template>
  <div v-if="$slots.left || $slots.right" class="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
    <div class="flex items-center gap-2 min-w-0 ps-3">
      <slot name="left"/>
    </div>
    <h1 class="text-2xl font-semibold text-center">
      <slot/>
    </h1>
    <div class="flex items-center justify-end gap-2 min-w-0 pe-3">
      <slot name="right"/>
    </div>
  </div>
  <div v-else class="flex items-center justify-center gap-4">
    <h1 class="ms-4 text-2xl font-semibold">
      <slot/>
    </h1>
  </div>
</template>
