<script setup lang="ts">
import type {StaffArticleItem} from '~~/shared/types/staffArticle'

const props = defineProps<{ article: StaffArticleItem; to: string }>()

const authors = computed(() => props.article.authors.map(a => ({
  id: a.user.id,
  name: [a.user.firstName, a.user.lastName].filter(Boolean).join(' ') || 'Автор',
  avatarUrl: null,
})))
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
      <ReaderCoverPlaceholder v-else/>

      <div class="absolute top-2 left-2 flex flex-wrap gap-1.5">
        <ArticleStatusBadge :status="article.status" class="bg-white"/>
        <UBadge
            v-if="article.blockedAt"
            label="Заблокирована"
            icon="i-lucide-lock"
            color="error"
            variant="subtle"
            size="sm"
            class="bg-white"
        />
      </div>
    </div>

    <div class="flex-1 flex flex-col gap-1.5 p-3">
      <div class="flex items-center gap-2 text-xs">
        <span class="text-toned ring ring-inset ring-default rounded-xs px-1.5 py-0.5 truncate">
          {{ article.area.name }}
        </span>
        <span class="text-dimmed shrink-0">
          Изменена {{ new Date(article.updatedAt).toLocaleDateString('ru') }}
        </span>
      </div>

      <h3 class="font-medium text-highlighted leading-snug">{{ article.title }}</h3>
      <p class="text-sm text-muted line-clamp-3">{{ article.excerpt }}</p>

      <div class="mt-auto pt-2">
        <ReaderAuthors :authors="authors"/>
      </div>
    </div>
  </NuxtLink>
</template>