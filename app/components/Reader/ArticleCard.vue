<script setup lang="ts">
import type { ReaderArticle } from '~~/shared/types/reader'

defineProps<{ article: ReaderArticle; to: string; showActions?: boolean }>()
const emit = defineEmits<{ favorite: [] }>()

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('ru') : ''
}
</script>

<template>
  <NuxtLink
      :to="to"
      class="flex flex-col page-card overflow-hidden hover:bg-white/85 transition duration-200"
  >
    <div class="relative shrink-0 aspect-[16/9] overflow-hidden bg-sub-200">
      <img
          v-if="article.coverUrl"
          :src="article.coverUrl"
          :alt="article.title"
          loading="lazy"
          class="absolute inset-0 w-full h-full object-cover"
      >
      <ReaderCoverPlaceholder v-else />

      <span
          v-if="showActions && article.isRead === false"
          class="absolute top-2 left-2 text-xs bg-white text-highlighted rounded-xs px-1.5 py-0.5"
      >
        Новая
      </span>

      <div v-if="showActions" class="absolute top-2 right-2 flex gap-1.5">
        <ReaderCommentButton
            v-if="article.comment"
            :comment="article.comment"
            :author="article.assignedBy"
            :date="article.assignedAt"
        />
        <ReaderFavoriteButton :active="!!article.isFavorite" @toggle="emit('favorite')" />
      </div>
    </div>

    <div class="flex-1 flex flex-col gap-1.5 p-3">
      <div class="flex items-center gap-2 text-xs">
        <span class="text-toned ring ring-inset ring-default rounded-xs px-1.5 py-0.5">
          {{ article.area.name }}
        </span>
        <span class="text-dimmed">{{ formatDate(article.publishedAt) }}</span>
      </div>

      <h3 class="font-medium text-highlighted leading-snug">{{ article.title }}</h3>
      <p class="text-sm text-muted line-clamp-3">{{ article.excerpt }}</p>

      <div class="mt-auto pt-2">
        <ReaderAuthors :authors="article.authors" />
      </div>
    </div>
  </NuxtLink>
</template>