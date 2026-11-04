<script setup lang="ts">
defineProps<{
  html: string
  title?: string
  note?: { text: string; author?: string; date?: string | null } | null
}>()

const open = defineModel<boolean>('open', { default: false })
const scrollTop = defineModel<number>('scrollTop', { default: 0 })

const pageRef = ref<{ scroller: HTMLElement | null } | null>(null)

function onScroll(event: Event) {
  scrollTop.value = (event.target as HTMLElement).scrollTop
}

// Окно открылось и область прокрутки появилась: ставим её на нужное место
watch(() => pageRef.value?.scroller, (el, oldEl) => {
  oldEl?.removeEventListener('scroll', onScroll)
  if (!el) return
  requestAnimationFrame(() => { el.scrollTop = scrollTop.value })
  el.addEventListener('scroll', onScroll, { passive: true })
})
</script>

<template>
  <UModal
      v-model:open="open"
      fullscreen
      :title="title || 'Статья'"
      :close="false"
      :ui="{
        header: 'sr-only',
        body: 'flex-1 flex flex-col min-h-0 p-0 sm:p-0 overflow-hidden',
      }"
  >
    <template #body>
      <WallpaperBackground
          place="CLIENT"
          fallback="view-background"
          contained
          class="flex-1 min-h-0 flex flex-col pt-2"
      >
        <Page ref="pageRef">
          <div class="sticky top-0 z-20 h-0 flex justify-end">
            <UTooltip text="Свернуть">
              <UButton
                  icon="i-lucide-minimize-2"
                  aria-label="Свернуть"
                  size="sm"
                  class="mt-2 me-2 size-7 bg-white/50! backdrop-blur-sm hover:bg-white/85!"
                  @click="open = false"
              />
            </UTooltip>
          </div>

          <ReaderArticleBody :html="html" :note="note" />
        </Page>
      </WallpaperBackground>
    </template>
  </UModal>
</template>