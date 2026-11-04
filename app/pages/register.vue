<script setup lang="ts">
import {useUserStore} from "~~/stores/user.ts";

definePageMeta({ layout: 'blank' })

const route = useRoute()
const store = useUserStore()
const toast = useToast()

const form = reactive({
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
})

const passwordConfirm = ref('')
const showPasswd = ref(false)
const loading = ref(false)
const token = computed(() => route.query.token as string | undefined)

// Ошибку показываем, только когда во втором поле уже что-то введено
const confirmError = computed(() =>
    passwordConfirm.value && passwordConfirm.value !== form.password
        ? 'Пароли не совпадают'
        : undefined,
)

async function submit() {
  if (form.password !== passwordConfirm.value) {
    toast.add({ title: 'Пароли не совпадают', color: 'error' })
    return
  }

  loading.value = true
  try {
    const user = await $fetch<any>('/api/auth/register', {
      method: 'POST',
      body: { ...form, token: token.value },
    })
    store.setUser(user)
    await navigateTo('/cabinet')
  } catch (e: any) {
    toast.add({
      title: 'Не удалось зарегистрироваться',
      description: e?.data?.message,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <WallpaperBackground place="LOGIN" fallback="login-background" class="min-h-screen flex items-center justify-center p-4">
    <div class="relative w-full max-w-[380px] bg-white/60 ring ring-inset ring-white/55 rounded-sm p-6">
      <h1 class="text-lg text-highlighted text-center mb-5">Регистрация</h1>

      <UForm :state="form" class="space-y-3" @submit="submit">
        <UFormField label="Логин" name="username" required>
          <UInput v-model="form.username" autocomplete="username" class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email" required>
          <UInput v-model="form.email" type="email" autocomplete="email" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Имя" name="firstName">
            <UInput v-model="form.firstName" autocomplete="given-name" class="w-full" />
          </UFormField>
          <UFormField label="Фамилия" name="lastName">
            <UInput v-model="form.lastName" autocomplete="family-name" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Пароль" name="password" required>
          <UInput
              v-model="form.password"
              :type="showPasswd ? 'text' : 'password'"
              autocomplete="new-password"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPasswd ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPasswd ? 'Скрыть пароль' : 'Показать пароль'"
                  :aria-pressed="showPasswd"
                  @click="showPasswd = !showPasswd"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Повторите пароль" name="passwordConfirm" :error="confirmError" required>
          <UInput
              v-model="passwordConfirm"
              :type="showPasswd ? 'text' : 'password'"
              autocomplete="new-password"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPasswd ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPasswd ? 'Скрыть пароль' : 'Показать пароль'"
                  :aria-pressed="showPasswd"
                  @click="showPasswd = !showPasswd"
              />
            </template>
          </UInput>
        </UFormField>

        <UButton
            type="submit"
            label="Зарегистрироваться"
            block
            class="justify-center mt-4 bg-white/50"
            :loading="loading"
            :disabled="!!confirmError"
        />
      </UForm>

      <p class="text-sm text-toned text-center mt-4">
        Уже есть аккаунт?
        <NuxtLink to="/login" class="underline hover:text-highlighted">Войти</NuxtLink>
      </p>
    </div>
  </WallpaperBackground>
</template>