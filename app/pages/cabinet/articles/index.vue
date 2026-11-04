<script setup lang="ts">
definePageMeta({ layout: 'cabinet' })

const { items, pending, toggleFavorite } = useCabinetArticles()
</script>

<template>
  <ReaderArticleList
      :articles="items"
      base-path="/cabinet/articles"
      :loading="pending"
      show-actions
      empty-text="Пока нет доступных статей."
      @favorite="toggleFavorite"
  />
</template>