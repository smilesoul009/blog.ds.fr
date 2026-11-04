<script setup lang="ts">
import type {ClientAccountItem} from '~~/shared/types/clientAccount'

const showBlocked = ref(false)
const isActiveFilter = computed(() => (showBlocked.value ? 'false' : undefined))
const view = useReaderView('client-accounts-view')

const {items, total, page, totalPages, search, pending} =
    useCrudList<ClientAccountItem>('/api/admin/clients', {
      filters: {isActive: isActiveFilter},
    })
</script>

<template>
  <Page>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <Header>Аккаунты клиентов</Header>
        <ViewToggle v-model="view"/>
      </div>
    </template>
    <template #toolbar>
      <div class="flex flex-wrap items-center gap-4">
        <UInput v-model="search" placeholder="Поиск" icon="i-lucide-search" class="max-w-sm"/>
        <USwitch v-model="showBlocked" label="Показать заблокированных"/>
      </div>
    </template>

    <CardList :items="items" :view="view" :pending="pending" kind="people" empty-text="Клиентов не найдено">
      <template #card="{ item }">
        <ClientAccountCard :client="item" :to="`/users/${item.id}?from=clients`"/>
      </template>
      <template #row="{ item }">
        <ClientAccountRow :client="item" :to="`/users/${item.id}?from=clients`"/>
      </template>
    </CardList>

    <template #footer v-if="totalPages > 1">
      <div class="flex justify-center pt-2">
        <UPagination v-model:page="page" :total="total" :items-per-page="20"/>
      </div>
    </template>
  </Page>
</template>