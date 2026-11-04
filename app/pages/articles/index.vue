<script setup lang="ts">
import type {ArticleStatus} from '@prisma/client'
import type {StaffArticleItem} from '~~/shared/types/staffArticle'
import {ARTICLE_STATUS_LABELS, toOptions} from '~~/shared/constants/enums'

const statusFilter = ref<ArticleStatus | null>(null)
const areaFilter = ref<string | null>(null)
const view = useReaderView('staff-articles-view')

const {items, total, page, totalPages, search, pending} =
    useCrudList<StaffArticleItem>('/api/articles', {
      filters: {status: statusFilter, areaId: areaFilter},
    })

const {data: areas} = await useFetch<{ items: { id: string; name: string }[] }>('/api/areas', {
  query: {limit: 100},
})

const statusOptions = [
  {label: 'Все, кроме архива', value: null},
  ...toOptions(ARTICLE_STATUS_LABELS),
]

const areaOptions = computed(() => [
  {label: 'Все направления', value: null},
  ...(areas.value?.items ?? []).map(a => ({label: a.name, value: a.id})),
])
</script>

<template>
  <Page>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <Header>Статьи</Header>
        <ViewToggle v-model="view"/>
      </div>
    </template>
    <template #toolbar>
      <div class="flex flex-wrap gap-3">
        <UInput v-model="search" placeholder="Поиск по названию и тексту" icon="i-lucide-search"
                class="flex-1 min-w-64"/>
        <USelect v-model="statusFilter" :items="statusOptions" class="w-52"/>
        <USelect v-model="areaFilter" :items="areaOptions" class="w-52"/>
        <UButton icon="i-lucide-plus" size="lg" to="/articles/new"/>
      </div>
    </template>

    <CardList :items="items" :view="view" :pending="pending">
      <template #card="{ item }">
        <ArticleStaffCard :article="item" :to="`/articles/${item.id}/view`"/>
      </template>
      <template #row="{ item }">
        <ArticleStaffRow :article="item" :to="`/articles/${item.id}/view`"/>
      </template>
    </CardList>

    <template #footer v-if="totalPages > 1">
      <div class="flex justify-center pt-2">
        <UPagination v-model:page="page" :total="total" :items-per-page="20"/>
      </div>
    </template>
  </Page>
</template>