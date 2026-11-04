<script setup lang="ts">
import type { ArticleStatus } from '@prisma/client'
import { ARTICLE_STATUS_LABELS } from '~~/shared/constants/enums'

const props = withDefaults(defineProps<{
  status: ArticleStatus
  size?: string
}>(), {
  size: 'size-8',
})

const ICONS: Record<ArticleStatus, string> = {
  DRAFT: 'i-lucide-notebook-pen',
  READY: 'i-lucide-square-check-big',
  REVIEW: 'i-lucide-user-round-check',
  ARCHIVED: 'i-lucide-archive-x',
}

const icon = computed(() => ICONS[props.status])
const label = computed(() => ARTICLE_STATUS_LABELS[props.status])
</script>

<template>
  <div class="flex w-22 shrink-0">
    <UIcon
        :name="icon"
        :class="[size, 'm-auto text-slate-500']"
        :aria-label="label"
    />
  </div>
</template>