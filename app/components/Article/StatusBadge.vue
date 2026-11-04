<script setup lang="ts">
import type { ArticleStatus } from '@prisma/client'
import { ARTICLE_STATUS_LABELS, ARTICLE_STATUS_COLORS } from '~~/shared/constants/enums'

defineProps<{ status: ArticleStatus }>()
</script>

<template>
  <UBadge
      :label="ARTICLE_STATUS_LABELS[status]"
      :color="ARTICLE_STATUS_COLORS[status] as any"
      variant="subtle"
      size="sm"
  />
</template>