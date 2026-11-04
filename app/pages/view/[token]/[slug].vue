<script setup lang="ts">
definePageMeta({ layout: 'invite' })

const route = useRoute()
const token = route.params.token as string
const slug = route.params.slug as string

const { data, status } = await useFetch<{ html: string }>(
    `/api/view/${token}/articles/${slug}`,
)
</script>

<template>
  <ReaderArticleView
      :html="data?.html ?? ''"
      :loading="status === 'pending'"
      :fallback="`/view/${token}`"
  />
</template>