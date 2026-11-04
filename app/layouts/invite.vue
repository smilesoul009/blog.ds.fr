<script setup lang="ts">
const route = useRoute()
const token = route.params.token as string
const { data } = useInvite(token)
</script>

<template>
  <WallpaperBackground place="CLIENT" fallback="view-background" class="h-screen flex flex-col">
    <NavBar>
      <NuxtLink
          :to="`/view/${token}`"
          class="min-w-0 flex items-center flex-1 justify-center px-3"
      >
        <span class="truncate text-lg font-medium text-highlighted">
          {{ data?.space.name ?? 'Материалы' }}
        </span>
      </NuxtLink>

      <template #right>
        <NuxtLink to="/login" class="nav-tab-right">
          <UIcon name="i-lucide-log-in" class="size-4" />
          <span class="hidden sm:inline">Войти</span>
        </NuxtLink>
        <NuxtLink :to="`/register?token=${token}`" class="nav-tab-right">
          <UIcon name="i-lucide-user-plus" class="size-4" />
          <span class="hidden sm:inline">Регистрация</span>
        </NuxtLink>
      </template>
    </NavBar>

    <slot />
  </WallpaperBackground>
</template>