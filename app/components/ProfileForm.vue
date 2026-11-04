<script setup lang="ts">
import type {PageTab} from '~~/shared/types/page'
import {profileUpdateSchema, passwordChangeSchema} from '~~/shared/schemas/profile'
import {useUserStore} from "~~/stores/user.ts";

const api = useApi()
const toast = useToast()
const store = useUserStore()
const {user} = storeToRefs(store)

const isClient = computed(() => user.value?.roles.includes('CLIENT') ?? false)

const tabs = computed<PageTab[]>(() => [
  {value: 'main', label: 'Основное'},
  {value: 'password', label: 'Пароль', footer: false},
  ...(isClient.value ? [{value: 'delete', label: 'Удаление аккаунта', footer: false}] : []),
])

const username = ref('')

interface ProfileFormData {
  email: string
  firstName: string
  lastName: string
  deletionRequestedAt: string
}

const {form, isDirty, saving, errors, load, save, reset} = useEditableForm<ProfileFormData>({
  initial: {email: '', firstName: '', lastName: '', deletionRequestedAt: ''},
  schema: profileUpdateSchema,

  load: async () => {
    const data = await api<any>('/api/profile')
    username.value = data.username
    return {
      email: data.email,
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      deletionRequestedAt: data.deletionRequestedAt ?? ''
    }
  },

  update: async (data) => {
    const updated = await api<any>('/api/profile', {method: 'PATCH', body: data})
    store.setUser(updated)
  },
})

await load()

const passwordForm = reactive({currentPassword: '', newPassword: ''})
const passwordErrors = ref<Record<string, string>>({})
const showCurrent = ref(false)
const showNew = ref(false)
const changingPassword = ref(false)

async function changePassword() {
  passwordErrors.value = {}

  const result = passwordChangeSchema.safeParse(toRaw(passwordForm))
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path.join('.')
      if (!passwordErrors.value[key]) passwordErrors.value[key] = issue.message
    }
    return
  }

  changingPassword.value = true
  try {
    await api('/api/profile/password', {method: 'POST', body: {...passwordForm}})
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    toast.add({title: 'Пароль изменён', color: 'success'})
  } catch (e: any) {
    toast.add({title: 'Не удалось изменить', description: e?.data?.message, color: 'error'})
  } finally {
    changingPassword.value = false
  }
}

const deleteOpen = ref(false)
const deletePassword = ref('')
const showDeletePassword = ref(false)
const deleting = ref(false)

async function deleteAccount() {
  deleting.value = true
  try {
    await api('/api/profile/delete', {method: 'POST', body: {password: deletePassword.value}})
    store.setUser(null)
    await navigateTo('/')
  } catch (e: any) {
    toast.add({title: 'Не удалось удалить', description: e?.data?.message, color: 'error'})
  } finally {
    deleting.value = false
  }
}

const deletionDate = computed(() => {
  const requested = form.deletionRequestedAt
  if (!requested) return ''
  const date = new Date(requested)
  date.setDate(date.getDate() + 30)
  return date.toLocaleDateString('ru')
})
</script>

<template>
  <Page card :tabs="tabs">
    <template #header>
      <Header>Профиль</Header>
    </template>

    <template #default="{ tab }">
      <!-- Основное -->
      <div v-if="tab === 'main'" class="space-y-4">
        <UFormField label="Логин">
          <UInput :model-value="username" disabled class="w-full"/>
        </UFormField>

        <UFormField label="Email" :error="errors.email" required>
          <UInput v-model="form.email" type="email" class="w-full"/>
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Имя">
            <UInput v-model="form.firstName" class="w-full"/>
          </UFormField>
          <UFormField label="Фамилия">
            <UInput v-model="form.lastName" class="w-full"/>
          </UFormField>
        </div>
      </div>

      <!-- Пароль -->
      <div v-else-if="tab === 'password'" class="space-y-4">
        <UFormField label="Текущий пароль" :error="passwordErrors.currentPassword" required>
          <UInput
              v-model="passwordForm.currentPassword"
              :type="showCurrent ? 'text' : 'password'"
              autocomplete="current-password"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showCurrent ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showCurrent ? 'Скрыть пароль' : 'Показать пароль'"
                  :aria-pressed="showCurrent"
                  @click="showCurrent = !showCurrent"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Новый пароль" :error="passwordErrors.newPassword" required>
          <UInput
              v-model="passwordForm.newPassword"
              :type="showNew ? 'text' : 'password'"
              autocomplete="new-password"
              class="w-full"
              :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showNew ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showNew ? 'Скрыть пароль' : 'Показать пароль'"
                  :aria-pressed="showNew"
                  @click="showNew = !showNew"
              />
            </template>
          </UInput>
        </UFormField>

        <div class="flex justify-end">
          <UButton
              label="Изменить"
              class="w-[130px] justify-center"
              :loading="changingPassword"
              @click="changePassword"
          />
        </div>
      </div>

      <!-- Удаление (только клиент) -->
      <div v-else-if="tab === 'delete'" class="space-y-4">
        <p v-if="form.deletionRequestedAt" class="text-toned">
          Вы запросили удаление аккаунта. Он будет удалён {{ deletionDate }}.
          Чтобы отменить, просто продолжайте пользоваться сервисом — при следующем
          входе запрос снимется автоматически.
        </p>
        <p v-else class="text-toned p-2">
          Аккаунт будет удалён через 30 дней вместе со всей историей чтения и избранным. <br>
          В течение этого времени вы можете его восстановить — достаточно снова войти в систему.
        </p>

        <div class="flex justify-end">
          <UButton
              label="Удалить аккаунт"
              class="w-[170px] justify-center"
              @click="deleteOpen = true"
          />
        </div>
      </div>

      <UModal v-model:open="deleteOpen" title="Удаление аккаунта">
        <template #body>
          <div class="space-y-4">
            <p class="text-sm">
              Вы выйдете из системы, а через 30 дней все ваши данные будут удалены.
              Если передумаете — просто войдите снова, и удаление отменится.
            </p>

            <UFormField label="Введите пароль для подтверждения" required>
              <UInput
                  v-model="deletePassword"
                  :type="showDeletePassword ? 'text' : 'password'"
                  class="w-full"
                  :ui="{ trailing: 'pe-1' }"
              >
                <template #trailing>
                  <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="showDeletePassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="showDeletePassword ? 'Скрыть пароль' : 'Показать пароль'"
                      @click="showDeletePassword = !showDeletePassword"
                  />
                </template>
              </UInput>
            </UFormField>

            <div class="flex justify-end gap-2">
              <UButton label="Отмена" class="w-[130px] justify-center" @click="deleteOpen = false"/>
              <UButton
                  label="Удалить"
                  class="w-[130px] justify-center"
                  :loading="deleting"
                  :disabled="!deletePassword"
                  @click="deleteAccount"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>

    <template #footer>
      <FormActions
          :is-dirty="isDirty"
          :saving="saving"
          :close-to="isClient ? '/cabinet/articles' : '/dashboard'"
          @save="save"
          @reset="reset"
      />
    </template>
  </Page>
</template>