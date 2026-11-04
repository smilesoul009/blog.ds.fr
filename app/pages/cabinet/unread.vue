<script setup lang="ts">
definePageMeta({ layout: 'cabinet' })

const { items, pending, toggleFavorite } = useCabinetArticles('unread')
</script>

<template>
  <ReaderArticleList
      :articles="items"
      base-path="/cabinet/articles"
      :loading="pending"
      show-actions
      empty-text="Новых статей нет. Всё прочитано."
      @favorite="toggleFavorite"
  />
</template>