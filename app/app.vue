<script setup lang="ts">
useHead({
  bodyAttrs: {class: 'no-copy'},
})
</script>
<template>
  <UApp :toaster="{ position: 'bottom-center' }">
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </UApp>
</template>
