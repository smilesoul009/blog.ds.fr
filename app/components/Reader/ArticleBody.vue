<script setup lang="ts">
defineProps<{
  html: string
  note?: { text: string; author?: string; date?: string | null } | null
}>()
</script>

<template>
  <div v-if="note" class="page-card p-3 sm:p-4 mb-2 flex gap-3">
    <UIcon name="i-lucide-message-square-text" class="size-5 shrink-0 text-toned mt-0.5" />
    <div class="min-w-0 space-y-1">
      <p class="text-xs text-dimmed">
        Комментарий{{ note.author ? ` от ${note.author}` : '' }}
        <template v-if="note.date"> · {{ new Date(note.date).toLocaleDateString('ru') }}</template>
      </p>
      <p class="text-sm text-default whitespace-pre-line">{{ note.text }}</p>
    </div>
  </div>

  <ArticleSheet class="min-h-full">
    <div class="article-content" v-html="html" />
  </ArticleSheet>
</template>