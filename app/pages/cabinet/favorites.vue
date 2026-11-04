<script setup lang="ts">
definePageMeta({ layout: 'cabinet' })

const { items, pending, toggleFavorite } = useCabinetArticles('favorites')
</script>

<template>
  <ReaderArticleList
      :articles="items"
      base-path="/cabinet/articles"
      :loading="pending"
      show-actions
      empty-text="Здесь появятся статьи, которые вы отметите звёздочкой."
      @favorite="toggleFavorite"
  />
</template>