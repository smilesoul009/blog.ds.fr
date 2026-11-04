<script setup lang="ts">
import type {WallpaperSlot} from '@prisma/client'

const props = withDefaults(defineProps<{
  place: WallpaperSlot
  fallback?: string
  contained?: boolean
}>(), {
  fallback: '',
  contained: false,
})

const layerClass = computed(() =>
    props.contained ? 'absolute inset-0' : 'fixed inset-0',
)

interface ActiveWallpapers {
  settings: {
    enabled: boolean
    intervalMs: number
    overlayOpacity: number
  }
  items: { id: string; url: string }[]
}

const device = ref<'DESKTOP' | 'MOBILE'>('DESKTOP')

const {data} = await useFetch<ActiveWallpapers>('/api/wallpapers/active', {
  query: computed(() => ({slot: props.place })),
})

const items = computed(() => data.value?.items ?? [])
const settings = computed(() => data.value?.settings)

const firstUrl = computed(() => items.value[0]?.url ?? null)

useHead({
  link: computed(() =>
      firstUrl.value
          ? [{ rel: 'preload', as: 'image', href: firstUrl.value }]
          : [],
  ),
})

const index = ref(0)
const layerA = ref<string | null>(null)
const layerB = ref<string | null>(null)
const showA = ref(true)

const storageKey = computed(() => `wallpaper:${props.place}`)

let timer: ReturnType<typeof setInterval> | null = null

function preload(url: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('load failed'))
    img.src = url
  })
}

async function showNext() {
  if (items.value.length < 2) return
  if (document.hidden) return

  const nextIndex = (index.value + 1) % items.value.length
  const nextUrl = items.value[nextIndex]!.url

  try {
    await preload(nextUrl)
  } catch {
    return
  }

  if (showA.value) {
    layerB.value = nextUrl
  } else {
    layerA.value = nextUrl
  }

  showA.value = !showA.value
  index.value = nextIndex
}

function startTimer() {
  stopTimer()
  const interval = settings.value?.intervalMs
  if (!interval || items.value.length < 2) return
  timer = setInterval(showNext, interval)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(async () => {
  if (!items.value.length) return
  layerA.value = items.value[0]!.url
  startTimer()
})

watch(items, async (list) => {
  stopTimer()
  index.value = 0
  layerB.value = null
  showA.value = true

  if (!list.length) {
    layerA.value = null
    return
  }

  await preload(list[0]!.url).catch(() => {
  })
  layerA.value = list[0]!.url
  startTimer()
})

onBeforeUnmount(stopTimer)

const hasImages = computed(() => !!layerA.value || !!layerB.value)
const overlay = computed(() => settings.value?.overlayOpacity ?? 0)
</script>

<template>
  <div class="relative isolate" :class="contained ? 'overflow-hidden' : ''">
    <div v-if="fallback" :class="[layerClass, '-z-20', fallback]" />

    <template v-if="firstUrl">
      <div
          :class="[layerClass, '-z-10', 'bg-cover bg-center transition-opacity duration-[1200ms]', showA ? 'opacity-100' : 'opacity-0']"
          :style="{ backgroundImage: layerA ? `url(${layerA})` : `url(${firstUrl})` }"
      />
      <div
          :class="[layerClass, '-z-10', 'bg-cover bg-center transition-opacity duration-[1200ms]', showA ? 'opacity-0' : 'opacity-100']"
          :style="{ backgroundImage: layerB ? `url(${layerB})` : 'none' }"
      />
    </template>

    <div
        :class="[layerClass, '-z-10', 'pointer-events-none']"
        :style="{ background: `rgba(25,50,70,${overlay})` }"
    />

    <slot />
  </div>
</template>