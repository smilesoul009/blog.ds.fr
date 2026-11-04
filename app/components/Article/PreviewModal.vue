<script setup lang="ts">
import type {JSONContent} from '@tiptap/vue-3'

const props = defineProps<{ content: JSONContent }>()
const open = defineModel<boolean>('open', {default: false})

const api = useApi()
const html = ref('')
const loading = ref(false)

const WIDTHS = [
  {label: 'Компьютер', value: 'max-w-6xl'},
  {label: 'Планшет', value: 'max-w-3xl'},
  {label: 'Телефон', value: 'max-w-[400px]'},
]

const width = ref('max-w-6xl')

watch(open, async (isOpen) => {
  if (!isOpen) return

  loading.value = true
  try {
    const result = await api<{ html: string }>('/api/render', {
      method: 'POST',
      body: {content: props.content},
    })
    html.value = result.html
  } catch {
    html.value = '<p>Не удалось построить предпросмотр.</p>'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UModal
      v-model:open="open"
      title="Предпросмотр"
      :ui="{ content: `${width} transition-all duration-200` }"
  >
    <template #body>
      <div class="flex flex-col h-[70vh] gap-3">
        <div class="shrink-0 flex gap-2">
          <UButton
              v-for="option in WIDTHS"
              :key="option.value"
              :label="option.label"
              size="sm"
              :class="width === option.value ? 'bg-sub-300!' : ''"
              @click="width = option.value"
          />
        </div>

        <WallpaperBackground
            place="CLIENT"
            fallback="view-background"
            contained
            class="flex-1 min-h-0 flex rounded-sm"
        >
          <Page class="mt-2">
            <ArticleSheet class="min-h-full">
              <p v-if="loading" class="text-center text-muted py-8">Загрузка...</p>
              <div v-else class="article-content" v-html="html" />
            </ArticleSheet>
          </Page>
        </WallpaperBackground>
      </div>
    </template>
  </UModal>
</template>