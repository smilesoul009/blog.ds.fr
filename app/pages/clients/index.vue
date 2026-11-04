<script setup lang="ts">
import type {ClientListItem} from '~~/shared/types/clientList'

const mineOnly = ref(false)
const mineFilter = computed(() => (mineOnly.value ? 'true' : undefined))
const view = useReaderView('clients-view')

const {items, total, page, totalPages, search, pending} =
    useCrudList<ClientListItem>('/api/clients', {
      filters: {mine: mineFilter},
    })
</script>

<template>
  <Page>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <Header>Статьи клиентам</Header>
        <ViewToggle v-model="view"/>
      </div>
    </template>
    <template #toolbar>
      <div class="flex flex-wrap items-center gap-4">
        <UInput v-model="search" placeholder="Поиск" icon="i-lucide-search" class="max-w-sm"/>
        <USwitch v-model="mineOnly" label="Только мои"/>
      </div>
    </template>

    <CardList :items="items" :view="view" :pending="pending" kind="people" empty-text="Клиентов не найдено">
      <template #card="{ item }">
        <ClientCard :client="item" :to="`/clients/${item.id}`"/>
      </template>
      <template #row="{ item }">
        <ClientRow :client="item" :to="`/clients/${item.id}`"/>
      </template>
    </CardList>

    <template #footer v-if="totalPages > 1">
      <div class="flex justify-center pt-2">
        <UPagination v-model:page="page" :total="total" :items-per-page="20"/>
      </div>
    </template>
  </Page>
</template>