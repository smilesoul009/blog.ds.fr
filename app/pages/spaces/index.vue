<script setup lang="ts">
import type {SpaceListItem} from '~~/shared/types/spaceList'

const view = useReaderView('spaces-view')

const {items, total, page, totalPages, search, pending} =
    useCrudList<SpaceListItem>('/api/spaces')
</script>

<template>
  <Page>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <Header>Подборки для гостей</Header>
        <ViewToggle v-model="view"/>
      </div>
    </template>
    <template #toolbar>
      <div class="flex justify-between gap-4">
        <UInput v-model="search" placeholder="Поиск" icon="i-lucide-search"/>
        <UButton icon="i-lucide-plus" size="lg" to="/spaces/new"/>
      </div>
    </template>

    <CardList :items="items" :view="view" :pending="pending">
      <template #card="{ item }">
        <SpaceCard :space="item" :to="`/spaces/${item.id}`"/>
      </template>
      <template #row="{ item }">
        <SpaceRow :space="item" :to="`/spaces/${item.id}`"/>
      </template>
    </CardList>

    <template #footer v-if="totalPages > 1">
      <div class="flex justify-center pt-2">
        <UPagination v-model:page="page" :total="total" :items-per-page="20"/>
      </div>
    </template>
  </Page>
</template>