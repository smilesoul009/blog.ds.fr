<script setup lang="ts">
import type { WallpaperSlot } from '@prisma/client'

withDefaults(defineProps<{
  place?: WallpaperSlot
  fallback?: string
  contained?: boolean
}>(), {
  place: 'CLIENT',
  fallback: 'view-background',
  contained: false,
})
</script>

<template>
  <WallpaperBackground
      :place="place"
      :fallback="fallback"
      :contained="contained"
      class="flex-1 min-h-0 flex flex-col"
  >
    <div class="flex-1 min-h-0 overflow-y-auto flex">
      <div class="flex-1 flex min-h-0 justify-center">
        <div class="flex-1 flex min-h-0 bg-white/40 m-2 border rounded-sm border-gray-50 p-2 max-w-6xl">
          <div class="flex-1 min-h-0 p-6 bg-muted/90">
            <ArticleSheet class="min-h-full">
              <slot />
            </ArticleSheet>
          </div>
        </div>
      </div>
    </div>
  </WallpaperBackground>
</template>