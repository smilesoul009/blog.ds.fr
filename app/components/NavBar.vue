<script setup lang="ts">
defineProps<{ homeTo?: string }>()

const scroller = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
let frame: number | null = null



function updateArrows() {
  const el = scroller.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 2
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
}

function startScroll(direction: -1 | 1) {
  stopScroll()
  const step = () => {
    const el = scroller.value
    if (!el) return
    el.scrollLeft += direction * 6
    updateArrows()
    frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

function stopScroll() {
  if (frame !== null) {
    cancelAnimationFrame(frame)
    frame = null
  }
}

onMounted(() => {
  updateArrows()
  window.addEventListener('resize', updateArrows)
})

onBeforeUnmount(() => {
  stopScroll()
  window.removeEventListener('resize', updateArrows)
})
</script>

<template>
  <div class="m-2 p-2 border border-gray-50 rounded-sm bg-white/40">
    <!-- Высота 64 px (была 56): пунктам меню просторнее, тени выбранного пункта сверху и снизу есть место -->
    <header class="shrink-0 flex items-stretch bg-sub-200 rounded-sm h-16 relative">
      <div class="absolute inset-2 border border-[var(--ui-border-accented)] pointer-events-none z-[2]" />

      <!-- Эмблема поверх края меню (z-[3]): меню заходит под неё на 12 px, чтобы тень первого пункта не обрезалась
           краем прокрутки; фон у эмблемы прозрачный, тень видна -->
      <div v-if="homeTo" class="shrink-0 flex items-stretch py-2 pl-2 relative z-[3]">
        <UTooltip text="Главная">
          <NuxtLink :to="homeTo" class="nav-tab px-2" aria-label="Главная">
            <img
                src="/images/emblem.png"
                alt=""
                draggable="false"
                class="size-8 object-contain opacity-80"
            >
          </NuxtLink>
        </UTooltip>
      </div>

      <button
          v-if="canScrollLeft"
          type="button"
          class="shrink-0 px-2 text-toned hover:bg-control-hover relative z-[1]"
          @mouseenter="startScroll(-1)"
          @mouseleave="stopScroll"
      >
        <UIcon name="i-lucide-chevron-left" class="size-4" />
      </button>

      <nav
          ref="scroller"
          class="flex-1 flex items-stretch overflow-x-auto scrollbar-none min-w-0 py-2 relative"
          :class="homeTo ? '-ms-3 ps-3' : 'pl-2'"
          @scroll="updateArrows"
      >
        <slot />
      </nav>

      <button
          v-if="canScrollRight"
          type="button"
          class="shrink-0 px-2 text-toned hover:bg-control-hover relative z-[1]"
          @mouseenter="startScroll(1)"
          @mouseleave="stopScroll"
      >
        <UIcon name="i-lucide-chevron-right" class="size-4" />
      </button>

      <div class="shrink-0 flex items-stretch py-2 pr-2 relative">
        <slot name="right" />
      </div>
    </header>
  </div>
</template>