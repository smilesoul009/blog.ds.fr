<script setup lang="ts">
import type {ArticleStatus} from '@prisma/client'
import {useUserStore} from "~~/stores/user.ts";
import {blockPersonName, type BlockPerson} from '~~/shared/types/articleBlock'

const {user} = storeToRefs(useUserStore())

interface ArticleItem {
  id: string
  title: string
  status: ArticleStatus
  updatedAt: string
  area: { name: string }
  blockedAt: string | null
}

interface SpaceItem {
  id: string
  name: string
  _count: { articles: number; accessLinks: number }
}

const {data: drafts} = await useFetch<{ items: ArticleItem[] }>('/api/articles', {
  query: {status: 'DRAFT', mine: 'true', limit: 5},
})

const {data: recent} = await useFetch<{ items: ArticleItem[] }>('/api/articles', {
  query: {limit: 5},
})

const {data: spaces} = await useFetch<{ items: SpaceItem[] }>('/api/spaces', {
  query: {limit: 5},
})

interface BlockedItem {
  id: string
  title: string
  area: { name: string }
  blockedAt: string
  blockedBy: BlockPerson | null
  blockReason: string | null
  blockReply: string | null
}

const {data: blocked} = await useFetch<{ items: BlockedItem[] }>('/api/articles/blocked')
const blockedItems = computed(() => blocked.value?.items ?? [])

const draftItems = computed(() => drafts.value?.items ?? [])
const recentItems = computed(() => recent.value?.items ?? [])
const spaceItems = computed(() => spaces.value?.items ?? [])

const greeting = computed(() => {
  const name = user.value?.firstName || user.value?.username
  const hour = new Date().getHours()
  const part = hour < 5 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'
  return `${part}, ${name}`
})

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <Page>
    <template #header>
      <Header>{{ greeting }}</Header>
    </template>

    <p v-if="!blockedItems.length && !draftItems.length && !recentItems.length && !spaceItems.length"
       class="text-muted">
      Пока ничего нет. Начните с создания статьи или подборки.
    </p>

    <div class="grid gap-4 lg:grid-cols-2 lg:grid-flow-row-dense">
      <PlanTodayPanel/>
      <SectionPanel
          v-if="blockedItems.length"
          title="Заблокированные статьи"
          class="lg:col-span-2"
      >
        <ul class="divide-y divide-default">
          <li v-for="item in blockedItems" :key="item.id">
            <NuxtLink
                :to="`/articles/${item.id}/view`"
                class="flex items-start gap-3 py-2.5 hover:text-highlighted"
            >
              <UIcon name="i-lucide-lock" class="size-5 shrink-0 text-toned mt-0.5"/>
              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex items-baseline justify-between gap-3">
                  <span class="truncate font-medium">{{ item.title }}</span>
                  <span class="text-xs text-dimmed shrink-0">{{ item.area.name }}</span>
                </div>
                <p class="text-sm text-toned line-clamp-2">
                  <span class="text-dimmed">
                    {{ blockPersonName(item.blockedBy) || 'Администратор' }},
                    {{ new Date(item.blockedAt).toLocaleDateString('ru') }}:
                  </span>
                  {{ item.blockReason }}
                </p>
                <p v-if="item.blockReply" class="text-xs text-dimmed line-clamp-1">
                  Ответ: {{ item.blockReply }}
                </p>
                <p v-else class="text-xs text-dimmed">Ответа ещё нет</p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </SectionPanel>
      <SectionPanel v-if="draftItems.length" title="Мои черновики">
        <template #actions>
          <UButton label="Все статьи" size="sm" to="/articles?status=DRAFT"/>
        </template>

        <ul class="divide-y divide-default">
          <li v-for="item in draftItems" :key="item.id">
            <NuxtLink
                :to="`/articles/${item.id}/view`"
                class="flex items-center justify-between gap-3 py-2.5 hover:text-highlighted"
            >
              <span class="truncate">{{ item.title }}</span>
              <span class="flex items-center gap-3 shrink-0">
                <span class="text-xs text-dimmed">{{ formatDate(item.updatedAt) }}</span>
                <UIcon name="i-lucide-pencil" class="size-4 text-dimmed"/>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </SectionPanel>

      <SectionPanel v-if="recentItems.length" title="Недавно изменённые статьи">
        <template #actions>
          <UButton label="Все статьи" size="sm" to="/articles"/>
        </template>

        <ul class="divide-y divide-default">
          <li v-for="item in recentItems" :key="item.id">
            <NuxtLink
                :to="`/articles/${item.id}`"
                class="flex items-center justify-between gap-3 py-2.5 hover:text-highlighted"
            >
              <div class="min-w-0">
                <div class="truncate">{{ item.title }}</div>
                <div class="text-xs text-dimmed">{{ item.area.name }}</div>
              </div>
              <span class="flex items-center gap-2 shrink-0">
                <UIcon v-if="item.blockedAt" name="i-lucide-lock" class="size-4 text-toned"/>
                <ArticleStatusIcon :status="item.status" size="size-5"/>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </SectionPanel>

      <SectionPanel v-if="spaceItems.length" title="Подборки для гостей">
        <template #actions>
          <UButton label="Все подборки" size="sm" to="/spaces"/>
        </template>

        <ul class="divide-y divide-default">
          <li v-for="item in spaceItems" :key="item.id">
            <NuxtLink
                :to="`/spaces/${item.id}`"
                class="flex items-center justify-between gap-3 py-2.5 hover:text-highlighted"
            >
              <span class="truncate">{{ item.name }}</span>
              <span class="text-xs text-dimmed shrink-0">
                статей: {{ item._count.articles }} · ссылок: {{ item._count.accessLinks }}
              </span>
            </NuxtLink>
          </li>
        </ul>
      </SectionPanel>
    </div>
  </Page>
</template>