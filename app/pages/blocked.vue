<script setup lang="ts">
import type {BlockedItem} from '~~/shared/types/blockedList'

const api = useApi()
const toast = useToast()
const view = useReaderView('blocked-view')

const {data, status, refresh} = await useFetch<{ items: BlockedItem[] }>('/api/articles/blocked')

// Сначала те, где автор уже ответил, — по ним нужно решение. Внутри групп — свежие сверху
const items = computed(() =>
    [...(data.value?.items ?? [])].sort((a, b) => {
      if (!!a.blockReply !== !!b.blockReply) return a.blockReply ? -1 : 1
      const aTime = new Date(a.blockReplyAt ?? a.blockedAt).getTime()
      const bTime = new Date(b.blockReplyAt ?? b.blockedAt).getTime()
      return bTime - aTime
    }),
)

const unblocking = ref<string | null>(null)

async function unblock(item: BlockedItem) {
  unblocking.value = item.id
  try {
    await api(`/api/articles/${item.id}/unblock`, {method: 'POST'})
    toast.add({title: 'Блокировка снята', description: item.title, color: 'success'})
    await refresh()
    await refreshNuxtData('blocked-count')
  } catch (e: any) {
    toast.add({title: 'Не удалось снять блокировку', description: e?.data?.message, color: 'error'})
  } finally {
    unblocking.value = null
  }
}
</script>

<template>
  <Page>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <Header>Заблокированные статьи</Header>
        <ViewToggle v-model="view"/>
      </div>
    </template>

    <CardList
        :items="items"
        :view="view"
        :pending="status === 'pending'"
        empty-text="Заблокированных статей нет."
    >
      <template #card="{ item }">
        <ArticleBlockedCard
            :item="item"
            :to="`/articles/${item.id}/view`"
            :loading="unblocking === item.id"
            @unblock="unblock(item)"
        />
      </template>
      <template #row="{ item }">
        <ArticleBlockedRow
            :item="item"
            :to="`/articles/${item.id}/view`"
            :loading="unblocking === item.id"
            @unblock="unblock(item)"
        />
      </template>
    </CardList>
  </Page>
</template>