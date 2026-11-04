<script setup lang="ts">
import {useUserStore} from "~~/stores/user.ts";

definePageMeta({ layout: 'blank' })

const store = useUserStore()
const toast = useToast()

const form = reactive({ username: '', password: '' })
const showPasswd = ref(false)
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    await store.login(form.username, form.password)
    await navigateTo('/dashboard')
  } catch (e: any) {
    toast.add({
      title: 'Не удалось войти',
      description: e?.data?.message ?? 'Проверьте логин и пароль',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <WallpaperBackground place="LOGIN" fallback="login-background" class="min-h-screen flex items-center justify-center p-4">
    <div class="relative w-full max-w-[340px] bg-white/60 ring ring-inset ring-white/55 rounded-sm p-6">
<!--      <h1 class="text-lg text-highlighted text-center mb-5">Вход</h1>-->

      <UForm :state="form" class="space-y-3" @submit="submit">
        <UFormField label="Логин" name="username" required>
          <UInput v-model="form.username" autocomplete="username" class="w-full" />
        </UFormField>

        <UFormField label="Пароль" name="password" required>
          <UInput
              class="w-full"
              v-model="form.password"
              placeholder="Пароль"
              :type="showPasswd ? 'text' : 'password'"
              :ui="{ trailing: 'pe-1' }">
            <template #trailing>
              <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPasswd ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPasswd ? 'Скрыть пароль' : 'Показать пароль'"
                  :aria-pressed="showPasswd"
                  aria-controls="password"
                  @click="showPasswd = !showPasswd" />
            </template>
          </UInput>
        </UFormField>

        <UButton
            type="submit"
            label="Войти"
            block
            class="justify-center mt-4 bg-white/50"
            :loading="loading"
        />
      </UForm>
      <p class="text-toned text-center mt-4 font-semibold">
        Нет аккаунта?
        <NuxtLink to="/register" class="underline hover:text-highlighted ">Зарегистрироваться</NuxtLink>
      </p>
    </div>
  </WallpaperBackground>
</template>