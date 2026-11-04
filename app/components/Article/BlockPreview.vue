<script setup lang="ts">
const api = useApi()

const props = defineProps<{ node: any }>()

const { data } = await useFetch<{ html: string }>('/api/render-block', {
  method: 'POST',
  body: computed(() => ({ node: props.node })),
})
</script>

<template>
  <div class="article-content" v-html="data?.html" />
</template>