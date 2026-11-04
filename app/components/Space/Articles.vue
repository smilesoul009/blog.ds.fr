<script setup lang="ts">
const api = useApi()

import type { ArticleStatus } from '@prisma/client'

const props = defineProps<{ spaceId: string }>()
const toast = useToast()

interface SpaceArticle {
  id: string
  title: string
  slug: string
  status: ArticleStatus
  position: number
}

const { data, refresh, status: fetchStatus } = await useFetch<SpaceArticle[]>(
    () => `/api/spaces/${props.spaceId}/articles`,
)

const articles = computed(() => data.value ?? [])

const pickerOpen = ref(false)
const pickerSearch = ref('')

const { data: available } = await useFetch<{ items: { id: string; title: string; status: ArticleStatus }[] }>(
    '/api/articles',
    {
      query: computed(() => ({ search: pickerSearch.value, limit: 20 })),
      watch: [pickerSearch],
    },
)

const candidates = computed(() => {
  const present = new Set(articles.value.map(a => a.id))
  return (available.value?.items ?? []).filter(a => !present.has(a.id))
})

async function add(articleId: string) {
  try {
    await api(`/api/spaces/${props.spaceId}/articles`, {
      method: 'POST',
      body: { articleId },
    })
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Не удалось добавить', description: e?.data?.message, color: 'error' })
  }
}

async function remove(articleId: string) {
  try {
    await api(`/api/spaces/${props.spaceId}/articles/${articleId}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Не удалось убрать', description: e?.data?.message, color: 'error' })
  }
}

async function move(index: number, delta: number) {
  const next = [...articles.value]
  const target = index + delta
  if (target < 0 || target >= next.length) return

  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved!)

  try {
    await api(`/api/spaces/${props.spaceId}/articles/reorder`, {
      method: 'POST',
      body: { articleIds: next.map(a => a.id) },
    })
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Не удалось изменить порядок', description: e?.data?.message, color: 'error' })
  }
}
</script>

<template>
  <SectionPanel title="Статьи в данной подборке">
    <template #actions>
      <div class="flex items-center justify-between">
        <UButton
            icon="i-lucide-plus"
            size="lg"
            @click="pickerOpen = true"/>
      </div>
    </template>

    <p v-if="fetchStatus === 'pending'" class="text-muted text-sm">Загрузка...</p>
    <p v-else-if="!articles.length" class="text-muted text-sm">
      Пока пусто. Добавьте статьи, которые увидит клиент.
    </p>

    <ul v-else class="divide-y divide-default">
      <li v-for="(article, index) in articles"
          :key="article.id"
          class="flex items-center gap-3 py-2">
        <span class="text-xs text-dimmed w-6">{{ index + 1 }}</span>

        <div class="flex-1 min-w-0">
          <NuxtLink :to="`/articles/${article.id}/view`" class="hover:underline">
            {{ article.title }}
          </NuxtLink>
          <ArticleStatusBadge :status="article.status" class="ml-2" />
        </div>

        <div class="flex gap-1">
          <UButton
              icon="i-lucide-chevron-up"
              size="xs"
              color="neutral"
              variant="ghost"
              :disabled="index === 0"
              @click="move(index, -1)"
          />
          <UButton
              icon="i-lucide-chevron-down"
              size="xs"
              color="neutral"
              variant="ghost"
              :disabled="index === articles.length - 1"
              @click="move(index, 1)"
          />
          <UButton
              icon="i-lucide-x"
              size="xs"
              color="error"
              variant="ghost"
              @click="remove(article.id)"
          />
        </div>
      </li>
    </ul>

    <UModal v-model:open="pickerOpen" title="Добавить статью">
      <template #body>
        <div class="space-y-3">
          <UInput
              v-model="pickerSearch"
              placeholder="Поиск по названию"
              icon="i-lucide-search"
              class="w-full"
          />

          <p v-if="!candidates.length" class="text-muted text-sm">Ничего не найдено</p>

          <ul v-else class="divide-y divide-default max-h-80 overflow-y-auto">
            <li
                v-for="article in candidates"
                :key="article.id"
                class="flex items-center justify-between gap-3 py-2"
            >
              <div class="min-w-0">
                <span>{{ article.title }}</span>
                <ArticleStatusBadge :status="article.status" class="ml-2" />
              </div>
              <UButton label="Добавить" size="xs" variant="soft" @click="add(article.id)" />
            </li>
          </ul>
        </div>
      </template>
    </UModal>
  </SectionPanel>
</template>