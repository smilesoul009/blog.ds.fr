<script setup lang="ts">
const fullscreen = defineModel<boolean>('fullscreen', {default: false})
</script>

<template>
  <UModal
      v-if="fullscreen"
      v-model:open="fullscreen"
      fullscreen
      title="План"
      :close="false"
      :ui="{
        header: 'sr-only',
        body: 'flex-1 flex flex-col min-h-0 p-0 sm:p-0 overflow-hidden',
      }"
  >
    <template #body>
      <WallpaperBackground
          place="APP"
          fallback="view-background"
          contained
          class="flex-1 min-h-0 flex flex-col pt-2"
      >
        <!-- Меню и текущая страница передаются из постоянного layout раздела «План». -->
        <div class="flex-1 flex min-h-0">
          <slot/>
        </div>
      </WallpaperBackground>
    </template>
  </UModal>
  <div v-else class="contents"><slot/></div>
</template>