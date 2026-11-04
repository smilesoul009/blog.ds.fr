<script setup lang="ts">
import { CLIENT_NAVIGATION, type NavItem } from '~~/shared/constants/navigation'

const route = useRoute()

// Числа для меню; перезапрашиваются при каждом переходе
const { data: counts } = useFetch<{ unread: number; favorites: number; blocked: number }>('/api/cabinet/counts', {
  key: 'cabinet-counts',
  watch: [() => route.path],
})

function isActive(to?: string) {
  if (!to) return false
  return route.path === to || route.path.startsWith(`${to}/`)
}

function countOf(item: NavItem) {
  return item.countKey ? (counts.value?.[item.countKey] ?? 0) : 0
}

// Пункт с countKey виден, если в нём есть статьи или клиент сейчас на нём
const items = computed(() => CLIENT_NAVIGATION.filter((item) => {
  if (!item.countKey || !counts.value) return true
  return countOf(item) > 0 || isActive(item.to)
}))
</script>

<template>
  <WallpaperBackground place="CLIENT" fallback="view-background" class="h-screen flex flex-col">
<!--    <ViewAsBanner />-->
    <NavBar>
      <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="nav-tab"
          :class="isActive(item.to) ? 'nav-tab-active' : ''"
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
        <ProfileMenu profile-to="/cabinet/profile" />
      </template>
    </NavBar>

    <slot />
  </WallpaperBackground>
</template>