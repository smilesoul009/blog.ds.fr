<script setup lang="ts">
import type {PageTab} from '~~/shared/types/page'

const props = withDefaults(defineProps<{
  tabs?: PageTab[]
  card?: boolean
  fit?: boolean     // высота по содержимому: рамка обтягивает его и снизу (а не тянется до низа окна)
}>(), {
  tabs: () => [],
  card: false,
  fit: false,
})

const showCard = computed(() => currentTab.value?.card ?? props.card)

const slots = useSlots()
const route = useRoute()
const router = useRouter()

const activeTab = computed({
  get: () => {
    const fromQuery = route.query.tab as string | undefined
    const known = props.tabs.find(t => t.value === fromQuery && !t.disabled)
    return known?.value ?? props.tabs[0]?.value ?? ''
  },
  set: (tab: string | number) => {
    router.replace({query: {...route.query, tab: String(tab)}})
  },
})

const currentTab = computed(() => props.tabs.find(t => t.value === activeTab.value))
const showFooter = computed(() => !!slots.footer && currentTab.value?.footer !== false)

const scroller = ref<HTMLElement | null>(null)
defineExpose({ scroller })
</script>

<template>
  <div class="flex-1 flex min-h-0 min-w-0 justify-center">
    <div
        class="flex-1 flex flex-col min-h-0 min-w-0 gap-2 bg-white/40 m-2 mt-0 border border-gray-50 rounded-sm p-2 max-w-6xl"
        :class="fit && 'self-start max-h-[calc(100%-0.5rem)]'"
    >
      <div v-if="slots.header" class="page-block py-3 px-2 shrink-0">
        <slot name="header"/>
      </div>

      <div v-if="slots.toolbar" class="page-block p-2 shrink-0">
        <slot name="toolbar"/>
      </div>

      <div ref="scroller" class="min-h-0 overflow-y-auto" :class="!fit && 'flex-1'">
        <div class="page-block p-2 sm:p-4" :class="!fit && 'min-h-full'">
          <UTabs v-if="tabs.length"
                 v-model="activeTab"
                 :items="tabs"
                 :content="false"
                 variant="link"
                 color="neutral"
                 class="pb-2 sticky top-0 z-10 bg-muted"
                 size="md"
          />
          <div :class="showCard ? 'page-card p-3 sm:p-4' : ''">
            <slot :tab="activeTab"/>
          </div>
        </div>
      </div>

      <div v-if="showFooter" class="page-block p-2 shrink-0">
        <slot name="footer" :tab="activeTab"/>
      </div>
    </div>
  </div>
</template>