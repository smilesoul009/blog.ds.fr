<script setup lang="ts">
import type {ReaderArticle} from '~~/shared/types/reader'

defineProps<{ article: ReaderArticle; to: string; showActions?: boolean }>()
const emit = defineEmits<{ favorite: [] }>()

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('ru') : ''
}
</script>

<template>
  <NuxtLink
      :to="to"
      class="flex items-center gap-3 page-card p-2.5 hover:bg-white/85 transition duration-200"
  >
    <div class="relative shrink-0 w-16 h-11 overflow-hidden rounded-xs bg-sub-200">
      <img
          v-if="article.coverUrl"
          :src="article.coverUrl"
          :alt="article.title"
          loading="lazy"
          class="absolute inset-0 w-full h-full object-cover"
      >
      <ReaderCoverPlaceholder v-else size="h-4/5" />
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-medium text-highlighted truncate">{{ article.title }}</span>
        <span
            v-if="showActions && article.isRead === false"
            class="text-xs bg-sub-200 text-highlighted rounded-xs px-1.5 py-0.5 shrink-0"
        >
          Новая
        </span>
      </div>
      <p class="text-xs text-muted truncate">
        {{ article.area.name }} · {{ formatDate(article.publishedAt) }} · {{ article.excerpt }}
      </p>
    </div>

    <ReaderAuthors :authors="article.authors" class="shrink-0 hidden sm:flex"/>
    <ReaderCommentButton
        v-if="showActions && article.comment"
        :comment="article.comment"
        :author="article.assignedBy"
        :date="article.assignedAt"
    />
    <ReaderFavoriteButton
        v-if="showActions"
        :active="!!article.isFavorite"
        @toggle="emit('favorite')"
    />
  </NuxtLink>
</template>