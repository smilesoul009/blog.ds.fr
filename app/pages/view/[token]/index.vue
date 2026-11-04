<script setup lang="ts">
definePageMeta({ layout: 'invite' })

const route = useRoute()
const token = route.params.token as string
const { data, error, status } = useInvite(token)
</script>

<template>
  <Page v-if="error">
    <div class="text-center py-10">
      <UIcon name="i-lucide-link-2-off" class="size-10 text-muted mb-3" />
      <h1 class="text-lg text-highlighted mb-2">Ссылка недоступна</h1>
      <p class="text-muted text-sm">
        {{ error.data?.message ?? 'Проверьте адрес или запросите новую ссылку.' }}
      </p>
    </div>
  </Page>

  <ReaderArticleList
      v-else
      :articles="data?.articles ?? []"
      :base-path="`/view/${token}`"
      :loading="status === 'pending'"
      empty-text="В этой подборке пока нет статей."
  />
</template>