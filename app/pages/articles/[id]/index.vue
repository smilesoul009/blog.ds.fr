<script setup lang="ts">
import type {JSONContent} from '@tiptap/vue-3'
import type {ArticleStatus} from '@prisma/client'
import {usePermissions} from "~~/composables/usePermissions.ts";
import type { ArticleBlock } from '~~/shared/types/articleBlock'
import { useUserStore } from '~~/stores/user.ts'

const {can} = usePermissions()

const api = useApi()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const routeId = route.params.id as string
const isCreating = routeId === 'new'
const articleId = ref(isCreating ? '' : routeId)

const editorRef = useTemplateRef<any>('editorRef')
const status = ref<ArticleStatus>('DRAFT')

const isStarter = ref(false)

const blocked = ref(false)

interface ArticleForm {
  title: string
  areaId: string
  content: JSONContent
}

const {form, isNew, loading, isDirty, saving, load, save, reset} = useEditableForm<ArticleForm>({
  initial: {
    title: '',
    areaId: '',
    content: {type: 'doc', content: [{type: 'paragraph'}]},
  },



  load: isCreating ? undefined : async () => {
    const data = await api<any>(`/api/articles/${articleId.value}`)
    status.value = data.status
    isStarter.value = data.isStarter
    blocked.value = !!data.blockedAt
    return {title: data.title, areaId: data.areaId, content: data.content}
  },

  create: async (data) => {
    return api<{ id: string }>('/api/articles', {
      method: 'POST',
      body: {...data, plainText: editorRef.value?.getPlainText() ?? ''},
    })
  },

  update: async (data) => {
    const cursor = editorRef.value?.captureCursor() ?? null
    await api(`/api/articles/${articleId.value}`, {
      method: 'PATCH',
      body: {...data, plainText: editorRef.value?.getPlainText() ?? ''},
    })
    nextTick(() => editorRef.value?.restoreCursor(cursor))
  },

  onCreated: async (created) => {
    articleId.value = created.id
    await router.replace(`/articles/${created.id}`)
  },
})

if (!isCreating) await load()

const {data: areas} = await useFetch<{ items: { id: string; name: string }[] }>('/api/areas', {
  query: {limit: 100},
})

const areaOptions = computed(() =>
    (areas.value?.items ?? []).map(a => ({label: a.name, value: a.id})),
)

const readonly = computed(() => status.value === 'ARCHIVED')
const canSave = computed(() => !!form.title && !!form.areaId)

definePageMeta({
  wallpaperSlot: 'CLIENT',
})

const changingStatus = ref(false)
const previewOpen = ref(false)

async function changeStatus(next: ArticleStatus) {
  const previous = status.value
  changingStatus.value = true

  try {
    if (isDirty.value) {
      const saved = await save()
      if (!saved) return
    }

    await api(`/api/articles/${articleId.value}/status`, {
      method: 'POST',
      body: {status: next},
    })

    await load()
    toast.add({title: 'Статус изменён', color: 'success'})
  } catch (e: any) {
    status.value = previous
    toast.add({
      title: 'Не удалось изменить статус',
      description: e?.data?.message,
      color: 'error',
    })
  } finally {
    changingStatus.value = false
  }
}

async function toggleStarter() {
  try {
    const result = await api<{ isStarter: boolean }>(
        `/api/articles/${articleId.value}/starter`,
        {method: 'POST'},
    )
    isStarter.value = result.isStarter
    toast.add({
      title: result.isStarter
          ? 'Добавлена в материалы для ознакомления'
          : 'Убрана из материалов для ознакомления',
      color: 'success',
    })
  } catch (e: any) {
    toast.add({title: 'Не удалось изменить', description: e?.data?.message, color: 'error'})
  }
}

// «Закрыть»: новая статья — в список, существующая — в её просмотр
function close() {
  if (isNew.value || !articleId.value) {
    return navigateTo('/articles')
  }
  const viewPath = `/articles/${articleId.value}/view`
  // Пришли из просмотра — просто шаг назад, чтобы «Назад» в просмотре вёл в список, а не снова в редактор
  if (import.meta.client && window.history.state?.back === viewPath) {
    router.back()
  } else {
    navigateTo(viewPath, { replace: true })
  }
}

</script>

<template>
  <Page v-if="!loading">
    <template #header>
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2 p-2 bg-muted/90 rounded-sm">
          <span class="text-sm text-toned shrink-0">Тема</span>
          <UInput v-model="form.title" :disabled="readonly" class="flex-1 min-w-[200px]"/>

          <span class="text-sm text-toned shrink-0">Направление</span>
          <USelect v-model="form.areaId" :items="areaOptions" :disabled="readonly" class="w-48"/>

          <!--          <UBadge v-if="isDirty" label="Есть изменения" color="warning" variant="subtle" size="sm" />-->

          <UTooltip text="Просмотр">
            <UButton icon="i-lucide-eye" @click="previewOpen = true">
              <span class="hidden xl:inline">Просмотр</span>
            </UButton>
          </UTooltip>

          <UTooltip
              v-if="can('article:markStarter')"
              :text="isStarter ? 'Убрать из ознакомления' : 'Для ознакомления'"
          >
            <UButton
                :icon="isStarter ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
                @click="toggleStarter"
            >
              <span class="hidden xl:inline">Для ознакомления</span>
            </UButton>
          </UTooltip>

          <ArticleStatusSelect
              :model-value="status"
              :is-dirty="isDirty"
              :disabled="changingStatus"
              class="ml-auto"
              @change="changeStatus"
          />
        </div>

        <div v-if="!readonly" id="editor-toolbar" class="bg-muted/90 rounded-sm p-2"/>
      </div>
    </template>

    <template v-if="blocked" #toolbar>
      <div class="flex items-center gap-3 px-2">
        <UIcon name="i-lucide-lock" class="size-5 shrink-0 text-toned" />
        <p class="text-sm text-default">
          Статья заблокирована — клиенты её не видят.
          Причина и ответ администратору — в
          <NuxtLink :to="`/articles/${articleId}/view`" class="underline hover:text-highlighted">просмотре статьи</NuxtLink>.
        </p>
      </div>
    </template>

    <UAlert
        v-if="readonly"
        icon="i-lucide-archive"
        title="Статья в архиве"
        description="Восстановите её, чтобы продолжить редактирование."
        color="neutral"
        variant="subtle"
        class="mb-2"
    />

    <ArticleSheet class="min-h-full shrink-0">
      <ArticleEditor v-if="!readonly" ref="editorRef" v-model="form.content"/>
      <div v-else class="article-content p-6 text-muted">
        Редактирование недоступно.
      </div>
    </ArticleSheet>
    <template #footer>
      <FormActions
          :is-dirty="isDirty"
          :saving="saving"
          :disabled="!canSave"
          class="p-2 bg-muted/90 rounded-sm"
          @save="save"
          @reset="reset"
          @close="close"
      />
    </template>
    <ArticlePreviewModal v-model:open="previewOpen" :content="form.content"/>
  </Page>
</template>