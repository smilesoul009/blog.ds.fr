<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  // Решаем, куда вести, ещё до отрисовки страницы
  middleware: async () => {
    const { $api } = useNuxtApp()
    try {
      const counts = await $api<{ unread: number }>('/api/cabinet/counts')
      return navigateTo(counts.unread > 0 ? '/cabinet/unread' : '/cabinet/articles', { replace: true })
    } catch {
      return navigateTo('/cabinet/articles', { replace: true })
    }
  },
})
</script>

<template>
  <div />
</template>