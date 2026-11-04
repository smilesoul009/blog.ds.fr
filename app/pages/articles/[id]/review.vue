<script setup lang="ts">
import type {ArticleStatus} from '@prisma/client'
import {usePermissions} from "~~/composables/usePermissions.ts";
import {useUserStore} from "~~/stores/user.ts";

const api = useApi()
const route = useRoute()
const toast = useToast()
const articleId = route.params.id as string

const {can} = usePermissions()
const {user} = storeToRefs(useUserStore())

const {data: article, refresh: refreshArticle} = await useFetch<{
  id: string
  title: string
  status: ArticleStatus
  content: any
  authors: { user: { id: string } }[]
}>(`/api/articles/${articleId}`)

const {data: rendered} = await useFetch<{ html: string }>(
    `/api/articles/${articleId}/preview`,
)

const {summary, items, byBlockId, approve, reject, clear, resolve, refresh} =
    useBlockReviews(articleId)

const canReview = computed(() =>
    can('article:review') && article.value?.status === 'REVIEW',
)

const canResolve = computed(() =>
    article.value?.authors.some(a => a.user.id === user.value?.id) ?? false,
)

const nodesById = computed(() => {
  const map = new Map<string, any>()
  for (const node of article.value?.content?.content ?? []) {
    if (node.attrs?.blockId) map.set(node.attrs.blockId, node)
  }
  return map
})

const blocks = computed(() =>
    items.value
        .map(item => ({blockId: item.blockId, node: nodesById.value.get(item.blockId)}))
        .filter(b => b.node),
)

async function publish() {
  try {
    await api(`/api/articles/${articleId}/status`, {
      method: 'POST',
      body: {status: 'READY'},
    })
    await refreshArticle()
    toast.add({title: 'Статья опубликована', color: 'success'})
  } catch (e: any) {
    toast.add({
      title: 'Нельзя опубликовать',
      description: e?.data?.message,
      color: 'error',
    })
  }
}

async function sendBack() {
  try {
    await api(`/api/articles/${articleId}/status`, {
      method: 'POST',
      body: {status: 'DRAFT'},
    })
    await refreshArticle()
    toast.add({title: 'Возвращено автору', color: 'success'})
  } catch (e: any) {
    toast.add({title: 'Ошибка', description: e?.data?.message, color: 'error'})
  }
}

const allApproved = computed(() => summary.value.pending === 0 && summary.value.total > 0)
</script>

<template>
  <div class="space-y-4 max-w-6xl">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold">{{ article?.title }}</h1>
        <ArticleStatusCard v-if="article" :status="article.status"/>
      </div>

      <div class="flex gap-2">
        <UButton label="К статье" color="neutral" variant="ghost" :to="`/articles/${articleId}`"/>
        <UButton
            v-if="canReview"
            label="Вернуть автору"
            color="neutral"
            variant="soft"
            @click="sendBack"
        />
        <UButton
            v-if="canReview"
            label="Опубликовать"
            :disabled="!allApproved"
            @click="publish"
        />
      </div>
    </div>

    <UCard>
      <div class="flex items-center gap-6 text-sm">
        <span>Всего блоков: <b>{{ summary.total }}</b></span>
        <span class="text-success">Одобрено: <b>{{ summary.approved }}</b></span>
        <span class="text-warning">Осталось: <b>{{ summary.pending }}</b></span>
      </div>
    </UCard>

    <div class="space-y-3">
      <div
          v-for="block in blocks"
          :key="block.blockId"
          class="grid gap-3 md:grid-cols-[1fr_20rem] items-start"
      >
        <UCard>
          <ArticleBlockPreview :node="block.node"/>
        </UCard>

        <ArticleBlockReviewPanel
            :item="byBlockId.get(block.blockId)"
            :can-review="canReview"
            :can-resolve="canResolve"
            @approve="approve(block.blockId)"
            @reject="c => reject(block.blockId, c)"
            @clear="clear(block.blockId)"
            @resolve="c => resolve(block.blockId, c)"
        />
      </div>
    </div>
  </div>
</template>