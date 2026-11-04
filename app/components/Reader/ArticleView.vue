<script setup lang="ts">
const props = defineProps<{
  html: string
  fallback: string
  loading?: boolean
  note?: { text: string; author?: string; date?: string | null } | null
}>()

const router = useRouter()

function back() {
  if (import.meta.client && window.history.state?.back) {
    router.back()
  } else {
    navigateTo(props.fallback)
  }
}

// Полноэкранный режим и общая позиция прокрутки
const pageRef = ref<{ scroller: HTMLElement | null } | null>(null)
const fullscreen = ref(false)
const scrollTop = ref(0)

function openFullscreen() {
  scrollTop.value = pageRef.value?.scroller?.scrollTop ?? 0
  fullscreen.value = true
}

// После закрытия возвращаем обычный вид к тому же месту
watch(fullscreen, (isOpen) => {
  if (isOpen) return
  nextTick(() => {
    const el = pageRef.value?.scroller
    if (el) el.scrollTop = scrollTop.value
  })
})
</script>

<template>
  <Page ref="pageRef">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <UButton
            icon="i-lucide-arrow-left"
            label="Назад"
            class="w-[130px] justify-center"
            @click="back"
        />
        <div class="flex items-center gap-2">
          <slot name="actions"/>
          <UTooltip text="Развернуть на весь экран">
            <UButton
                icon="i-lucide-maximize-2"
                aria-label="Развернуть"
                size="sm"
                :disabled="loading || !html"
                @click="openFullscreen"
            />
          </UTooltip>
        </div>
      </div>
    </template>

    <template v-if="$slots.notice" #toolbar>
      <slot name="notice" />
    </template>

    <p v-if="loading" class="text-muted">Загрузка...</p>
    <ReaderArticleBody v-else :html="html" :note="note" />

    <ReaderFullscreenView
        v-model:open="fullscreen"
        v-model:scroll-top="scrollTop"
        :html="html"
        :note="note"
    />
  </Page>
</template>