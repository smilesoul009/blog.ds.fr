<script setup lang="ts">
import type { ArticleStatus } from '@prisma/client'
import { ARTICLE_STATUS_LABELS } from '~~/shared/constants/enums'

const props = defineProps<{ status: ArticleStatus }>()

const ICONS: Record<ArticleStatus, string> = {
  DRAFT: 'i-lucide-pencil-line',
  REVIEW: 'i-lucide-user-round-pen',
  READY: 'i-lucide-check-circle-2',
  ARCHIVED: 'i-lucide-archive',
}
const COLORS: Record<ArticleStatus, string> = {
  DRAFT: 'ring ring-gray-900',
  REVIEW: 'ring ring-blue-500 text-blue-800',
  READY: 'ring ring-green-300 text-green-800',
  ARCHIVED: 'ring ring-gray-900 text-red-800',
}

const icon = computed(() => ICONS[props.status])
const label = computed(() => ARTICLE_STATUS_LABELS[props.status])
const color = computed(() => COLORS[props.status])
</script>

<template>
  <UButton :icon="icon" :label="label" variant="outline" class="w-39"/>
</template>