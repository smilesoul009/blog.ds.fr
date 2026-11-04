<script setup lang="ts">
import type { ArticleStatus } from '@prisma/client'
import { ARTICLE_STATUS_LABELS } from '~~/shared/constants/enums'

const props = defineProps<{
  modelValue: ArticleStatus
  isDirty: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  change: [status: ArticleStatus]
}>()



const ICONS: Record<ArticleStatus, string> = {
  DRAFT: 'i-lucide-pencil-line',
  REVIEW: 'i-lucide-eye',
  READY: 'i-lucide-check-circle-2',
  ARCHIVED: 'i-lucide-archive',
}

const items = computed(() => [
  { label: ARTICLE_STATUS_LABELS.DRAFT, value: 'DRAFT', icon: ICONS.DRAFT },
  { label: ARTICLE_STATUS_LABELS.READY, value: 'READY', icon: ICONS.READY },
  { type: 'separator' as const },
  { label: ARTICLE_STATUS_LABELS.ARCHIVED, value: 'ARCHIVED', icon: ICONS.ARCHIVED },
])

const current = computed({
  get: () => props.modelValue,
  set: (value: ArticleStatus) => {
    if (value !== props.modelValue) emit('change', value)
  },
})
</script>

<template>
  <USelect
      v-model="current"
      :items="items"
      :icon="ICONS[modelValue]"
      :disabled="disabled"
      class="w-52"
  />
</template>