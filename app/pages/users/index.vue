<script setup lang="ts">
import type {UserListItem} from '~~/shared/types/userList'

const showInactive = ref(false)
const isActiveFilter = computed(() => (showInactive.value ? 'false' : undefined))
const view = useReaderView('users-view')

const {items, total, page, totalPages, search, pending} =
    useCrudList<UserListItem>('/api/users', {
      filters: {isActive: isActiveFilter},
    })
</script>

<template>
  <Page>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <Header>Пользователи</Header>
        <ViewToggle v-model="view"/>
      </div>
    </template>
    <template #toolbar>
      <div class="flex flex-wrap items-center gap-4">
        <UInput v-model="search" placeholder="Поиск" icon="i-lucide-search" class="max-w-sm"/>
        <USwitch v-model="showInactive" label="Показать отключённых" color="primary" :highlight="true"/>
        <UButton icon="i-lucide-plus" class="ms-auto" size="lg" to="/users/new"/>
      </div>
    </template>

    <CardList :items="items" :view="view" :pending="pending" kind="people">
      <template #card="{ item }">
        <UserCard :user="item" :to="`/users/${item.id}`"/>
      </template>
      <template #row="{ item }">
        <UserRow :user="item" :to="`/users/${item.id}`"/>
      </template>
    </CardList>

    <template #footer v-if="totalPages > 1">
      <div class="flex justify-center pt-2">
        <UPagination v-model:page="page" :total="total" :items-per-page="20"/>
      </div>
    </template>
  </Page>
</template>