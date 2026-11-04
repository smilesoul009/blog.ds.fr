<script setup lang="ts">
import type {ReaderArticle} from '~~/shared/types/reader'

const props = defineProps<{
  articles: ReaderArticle[]
  basePath: string
  loading?: boolean
  showActions?: boolean
  emptyText?: string
}>()

const emit = defineEmits<{ favorite: [article: ReaderArticle] }>()

const route = useRoute()
const router = useRouter()
const view = useReaderView()

const areas = computed(() => {
  const map = new Map<string, string>()
  for (const a of props.articles) map.set(a.area.id, a.area.name)
  return [...map].map(([id, name]) => ({id, name}))
})

const activeArea = computed({
  get: () => (route.query.area as string) || '',
  set: (value: string) => {
    router.replace({query: {...route.query, area: value || undefined}})
  },
})

const visible = computed(() =>
    activeArea.value
        ? props.articles.filter(a => a.area.id === activeArea.value)
        : props.articles,
)
</script>

<template>
  <Page>
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex-1 min-w-0 flex gap-2 overflow-x-auto scrollbar-none">
          <button
              type="button"
              class="reader-chip"
              :class="!activeArea ? 'reader-chip-active' : ''"
              @click="activeArea = ''"
          >
            Все направления
          </button>
          <button
              v-for="area in areas"
              :key="area.id"
              type="button"
              class="reader-chip"
              :class="activeArea === area.id ? 'reader-chip-active' : ''"
              @click="activeArea = area.id"
          >
            {{ area.name }}
          </button>
        </div>

        <ViewToggle v-model="view"/>
      </div>
    </template>

    <p v-if="loading" class="text-muted">Загрузка...</p>

    <p v-else-if="!visible.length" class="text-muted">
      {{ emptyText ?? 'Статей пока нет.' }}
    </p>

    <div v-else-if="view === 'cards'" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <ReaderArticleCard
          v-for="article in visible"
          :key="article.id"
          :article="article"
          :to="`${basePath}/${article.slug}`"
          :show-actions="showActions"
          @favorite="emit('favorite', article)"
      />
    </div>

    <div v-else class="space-y-2">
      <ReaderArticleRow
          v-for="article in visible"
          :key="article.id"
          :article="article"
          :to="`${basePath}/${article.slug}`"
          :show-actions="showActions"
          @favorite="emit('favorite', article)"
      />
    </div>
  </Page>
</template>