<script setup lang="ts">
interface ReviewItem {
  id: string
  title: string
  updatedAt: string
  area: { name: string }
  authors: { user: { firstName: string | null; lastName: string | null } }[]
}

const statusFilter = ref('REVIEW')
const {items, pending} = useCrudList<ReviewItem>('/api/articles', {
  filters: {status: statusFilter},
})
</script>

<template>
  <Page>
    <template #header>
      <Header>На проверке</Header>
    </template>
    <p v-if="pending" class="text-muted">Загрузка...</p>
    <p v-else-if="!items.length" class="text-muted">Нет статей, ожидающих проверки.</p>

    <div v-else class="space-y-2">
      <UCard v-for="item in items" :key="item.id">
        <div class="flex items-center justify-between gap-4">
          <div>
            <NuxtLink :to="`/articles/${item.id}/review`" class="font-medium hover:underline">
              {{ item.title }}
            </NuxtLink>
            <p class="text-sm text-muted mt-1">
              {{ item.area.name }} ·
              {{ item.authors.map(a => [a.user.firstName, a.user.lastName].filter(Boolean).join(' ')).join(', ') }}
            </p>
          </div>
          <UButton label="Проверить" size="sm" variant="soft" :to="`/articles/${item.id}/review`"/>
        </div>
      </UCard>
    </div>
  </Page>
</template>