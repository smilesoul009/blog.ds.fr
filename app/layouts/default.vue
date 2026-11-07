<script setup lang="ts">
import type { NavItem } from '~~/shared/constants/navigation'
import {usePermissions} from "~~/composables/usePermissions.ts";

const route = useRoute()
const wallpaperSlot = computed(() => (route.meta.wallpaperSlot as any) ?? 'APP')
const { mainItems, settingsItems, inSettings, settingsEntry, inPlan } = useNavigation()

// Полноэкранный режим «Плана» живёт в layout, а не в отдельных страницах:
// при смене периода и переходе к «Временным» / году модальное окно не пересоздаётся.
const planFullscreen = useState<boolean>('plan-fullscreen-active', () => false)
const planFullscreenCookie = useCookie<boolean>('plan-fullscreen', {
  default: () => false,
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})
const planFullscreenReady = ref(false)
onMounted(() => {
  planFullscreen.value = !!planFullscreenCookie.value
  planFullscreenReady.value = true
})
watch(planFullscreen, value => {
  if (planFullscreenReady.value) planFullscreenCookie.value = value
})

const { can } = usePermissions()
const api = useApi()

// Число заблокированных статей; запрашиваем только у того, кто может блокировать
const { data: blocked } = useAsyncData(
    'blocked-count',
    () => can('article:block')
        ? api<{ count: number }>('/api/articles/blocked-count')
        : Promise.resolve({ count: 0 }),
    { watch: [() => route.path] },
)

function countOf(item: NavItem) {
  return item.countKey === 'blocked' ? (blocked.value?.count ?? 0) : 0
}

// Пункт со счётчиком виден, если в нём что-то есть или мы сейчас в этом разделе
const visibleItems = computed(() =>
    unref(mainItems).filter(item => !item.countKey || countOf(item) > 0 || isTabActive(item)),
)

function isTabActive(item: NavItem) {
  return [item.to, ...(item.match ?? [])]
      .some(p => !!p && (route.path === p || route.path.startsWith(`${p}/`)))
}

function isActive(to: string) {
  const from = route.query.from as string | undefined
  if (from === 'clients') return to === '/settings/clients'
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <WallpaperBackground :place="wallpaperSlot" fallback="app-background" class="h-screen flex flex-col">
<!--    <ViewAsBanner />-->
    <NavBar home-to="/dashboard">
      <NuxtLink
          v-for="item in visibleItems"
          :key="item.to"
          :to="item.to"
          class="nav-tab"
          :class="isTabActive(item) ? 'nav-tab-active' : ''"
      >
        {{ item.label }}
        <span
            v-if="item.showCount && countOf(item) > 0"
            class="ms-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-sub-550 text-white text-xs font-medium"
        >
          {{ countOf(item) > 99 ? '99+' : countOf(item) }}
        </span>
      </NuxtLink>

      <template #right>
        <NotificationBell />
        <NuxtLink
            v-if="settingsEntry"
            :to="settingsEntry"
            class="nav-tab-right"
            :class="inSettings ? 'nav-tab-active' : ''"
            aria-label="Настройки сайта"
        >
          <UIcon name="i-lucide-settings" class="size-5" />
        </NuxtLink>
        <ProfileMenu profile-to="/profile" notifications-to="/notifications" />
      </template>
    </NavBar>

    <div class="flex-1 flex min-h-0">
      <SideMenu v-if="inSettings" :items="settingsItems" fill :is-active="item => isActive(item.to ?? '')"/>
      <PlanShell v-if="inPlan" v-model:fullscreen="planFullscreen">
        <PlanSectionMenu/>
        <slot/>
      </PlanShell>
      <slot v-else/>
    </div>
  </WallpaperBackground>
</template>