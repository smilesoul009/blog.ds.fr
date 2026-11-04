<script setup lang="ts">
definePageMeta({ layout: 'cabinet' })

const route = useRoute()
const api = useApi()
const slug = route.params.slug as string

const { data, status } = await useFetch<{
  id: string
  html: string
  isFavorite: boolean
  comment: { text: string; author: string; date: string | null } | null
}>(`/api/cabinet/articles/${slug}`)

const isFavorite = ref(data.value?.isFavorite ?? false)

async function toggleFavorite() {
  if (!data.value) return
  const result = await api<{ isFavorite: boolean }>(
      `/api/cabinet/articles/${data.value.id}/favorite`,
      { method: 'POST' },
  )
  isFavorite.value = result.isFavorite
  await refreshNuxtData('cabinet-counts')
}
</script>

<template>
  <ReaderArticleView
      :html="data?.html ?? ''"
      :note="data?.comment"
      :loading="status === 'pending'"
      fallback="/cabinet/articles"
  >
    <template #actions>
      <ReaderFavoriteButton :active="isFavorite" @toggle="toggleFavorite" />
    </template>
  </ReaderArticleView>
</template>