<script setup lang="ts">
import type { ArticleStatus } from '@prisma/client'
import type { ArticleBlock } from '~~/shared/types/articleBlock'
import { useUserStore } from '~~/stores/user.ts'

definePageMeta({ wallpaperSlot: 'CLIENT' })

const route = useRoute()
const api = useApi()
const toast = useToast()
const id = route.params.id as string

const { data, status, error, refresh } = await useFetch<{
  id: string
  title: string
  status: ArticleStatus
  html: string
  canEdit: boolean
  canBlock: boolean
  block: ArticleBlock | null
  canReply: boolean
  blocked: boolean
}>(`/api/articles/${id}/view`)

const blockOpen = ref(false)
const unblocking = ref(false)

async function unblock() {
  unblocking.value = true
  try {
    await api(`/api/articles/${id}/unblock`, { method: 'POST' })
    toast.add({ title: 'Блокировка снята', color: 'success' })
    await refresh()
    await refreshNuxtData('blocked-count')
  } catch (e: any) {
    toast.add({ title: 'Не удалось снять блокировку', description: e?.data?.message, color: 'error' })
  } finally {
    unblocking.value = false
  }
}
async function onReplied() {
  await refresh()
}
</script>

<template>
  <ReaderArticleView
      :html="data?.html ?? ''"
      :loading="status === 'pending'"
      fallback="/articles"
  >
    <template #actions>
      <ArticleStatusBadge v-if="data" :status="data.status" />
      <UBadge
          v-if="data?.blocked"
          label="Заблокирована"
          icon="i-lucide-lock"
          color="error"
          variant="subtle"
          size="sm"
      />

      <!-- Администратор -->
      <template v-if="data?.canBlock">
        <UTooltip v-if="!data.blocked" text="Заблокировать">
          <UButton icon="i-lucide-lock" aria-label="Заблокировать" size="sm" @click="blockOpen = true" />
        </UTooltip>
        <template v-else>
          <UTooltip text="Изменить причину блокировки">
            <UButton icon="i-lucide-message-square-warning" aria-label="Изменить причину" size="sm" @click="blockOpen = true" />
          </UTooltip>
          <UTooltip text="Снять блокировку">
            <UButton icon="i-lucide-lock-open" aria-label="Разблокировать" size="sm" :loading="unblocking" @click="unblock" />
          </UTooltip>
        </template>
      </template>

      <UTooltip v-if="data?.canReply" text="Редактировать">
        <UButton icon="i-lucide-pencil" aria-label="Редактировать" size="sm" :to="`/articles/${id}`" />
      </UTooltip>
    </template>

    <template v-if="data?.block" #notice>
      <ArticleBlockNotice
          :article-id="id"
          :block="data.block"
          :can-reply="data.canEdit"
          @replied="onReplied"
      />
    </template>
  </ReaderArticleView>

  <ArticleBlockModal
      v-if="data?.canBlock"
      v-model:open="blockOpen"
      :article-id="id"
      :reason="data.block?.reason"
      @done="() => { refresh(); refreshNuxtData('blocked-count') }"
  />

  <p v-if="error" class="text-center text-muted mt-4">
    {{ error.data?.message ?? 'Не удалось открыть статью' }}
  </p>
</template>