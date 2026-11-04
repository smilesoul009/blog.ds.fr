<script setup lang="ts">
definePageMeta({ layout: 'blank' })
</script>

<template>
  <WallpaperBackground place="LOGIN" fallback="login-background" class="min-h-screen flex items-center justify-center p-4">
    <div class="relative w-full max-w-[460px] bg-white/60 ring ring-inset ring-white/55 rounded-sm px-7 pt-6 pb-5 text-center">
      <h1 class="text-2xl  mb-2.5 font-semibold text-toned">Добро пожаловать!</h1>
      <p class="mb-12 font-inter">Для продолжения работы войдите в систему</p>
      <UButton
          to="/login"
          icon="i-lucide-log-in"
          label="Вход"
          class="absolute w-[130px] justify-center bg-muted/60 hover:bg-muted/80 end-4 bottom-4"
      />
    </div>
  </WallpaperBackground>
</template>