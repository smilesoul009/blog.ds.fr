<script setup lang="ts">
import type {StaffArticleItem} from '~~/shared/types/staffArticle'
import StatusIcon from '~/components/Article/StatusIcon.vue'

const props = defineProps<{ article: StaffArticleItem; to: string }>()

const authorNames = computed(() => props.article.authors
    .map(a => [a.user.firstName, a.user.lastName].filter(Boolean).join(' '))
    .join(', '))
</script>

<template>
  <ListRow :to="to" class="flex items-center justify-between gap-4 p-2.5!">
    <div class="flex items-center gap-4 min-w-0">
      <div class="relative shrink-0 w-20 h-14 overflow-hidden rounded-xs bg-sub-200">
        <img
            v-if="article.coverUrl"
            :src="article.coverUrl"
            :alt="article.title"
            loading="lazy"
            class="absolute inset-0 w-full h-full object-cover"
        >
        <ReaderCoverPlaceholder v-else size="h-4/5"/>
      </div>

      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-medium">{{ article.title }}</p>
          <ArticleStatusBadge :status="article.status"/>
          <UBadge
              v-if="article.blockedAt"
              label="Заблокирована"
              icon="i-lucide-lock"
              color="error"
              variant="subtle"
              size="sm"
          />
        </div>
        <p class="text-sm text-highlighted mt-1 truncate">
          {{ article.area.name }} · {{ authorNames }}
        </p>
        <p class="text-xs text-toned mt-1">
          Изменена {{ new Date(article.updatedAt).toLocaleString('ru') }}
        </p>
      </div>
    </div>
    <StatusIcon :status="article.status"/>
  </ListRow>
</template>