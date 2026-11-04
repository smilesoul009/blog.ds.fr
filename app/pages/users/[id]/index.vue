<script setup lang="ts">
const api = useApi()

import type {Role} from '@prisma/client'
import {ROLE_LABELS, toOptions} from '~~/shared/constants/enums'
import {useUserStore} from "~~/stores/user.ts";
import {userCreateSchema, userUpdateSchema} from '~~/shared/schemas/user'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const routeId = route.params.id as string
const isCreating = routeId === 'new'
const userId = ref(isCreating ? '' : routeId)
const showPasswd = ref(false)

const {user: currentUser} = storeToRefs(useUserStore())
const isSelf = computed(() => userId.value === currentUser.value?.id)

interface UserForm {
  username: string
  email: string
  firstName: string
  lastName: string
  roles: Role[]
  isActive: boolean
  password: string
}

const {form, isNew, isDirty, saving, load, save, reset, errors} = useEditableForm<UserForm>({
  initial: {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    roles: ['AUTHOR'],
    isActive: true,
    password: ''
  },

  schema: isCreating ? userCreateSchema : userUpdateSchema,

  load: isCreating ? undefined : async () => {
    const data = await api<any>(`/api/users/${userId.value}`)
    return {
      username: data.username,
      email: data.email,
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      roles: data.roles,
      isActive: data.isActive,
      password: '',
    }
  },

  create: (data) => api<{ id: string }>('/api/users', {method: 'POST', body: data}),

  update: (data) => {
    const body: any = {...data}
    if (!body.password) delete body.password
    return api<string>(`/api/users/${userId.value}`, {method: 'PATCH', body})
  },

  onCreated: async (created) => {
    userId.value = created.id
    await router.replace(`/users/${created.id}`)
  },
})

const isClientAccount = computed(() => form.roles.includes('CLIENT'))

const rolesName = computed(() => {
  return form.roles
})

if (!isCreating) await load()

const roleOptions = toOptions(ROLE_LABELS)

const canSave = computed(() => {
  if (!form.username || !form.email || !form.roles.length) return false
  if (isNew.value && !form.password) return false
  return true
})

async function remove() {
  try {
    await api(`/api/users/${userId.value}`, {method: 'DELETE'})
    toast.add({title: 'Пользователь удалён', color: 'success'})
    await navigateTo('/users')
  } catch (e: any) {
    toast.add({
      title: 'Не удалось удалить',
      description: e?.data?.message,
      color: 'error',
    })
  }
}

const deleteOpen = ref(false)

async function confirmDelete() {
  if (!userId.value) return

  try {
    await api(`/api/admin/clients/${userId.value}`, {method: 'DELETE'})
    deleteOpen.value = false
    toast.add({title: 'Учётная запись удалена', color: 'success'})
    await navigateTo('/clients')
  } catch (e: any) {
    toast.add({title: 'Не удалось удалить', description: e?.data?.message, color: 'error'})
  }
}

const closeTo = computed(() =>
    route.query.from === 'clients' ? '/settings/clients' : '/users',
)

import {usePermissions} from '~~/composables/usePermissions.ts'

const {can} = usePermissions()
const store = useUserStore()

const canViewAs = computed(() =>
    !isNew.value && !isSelf.value && !form.roles.includes('ADMIN') && can('user:viewAs'),
)

async function viewAs() {
  try {
    await store.startViewAs(userId.value, route.fullPath)
  } catch (e: any) {
    toast.add({title: 'Не удалось включить просмотр', description: e?.data?.message, color: 'error'})
  }
}
</script>

<template>
  <Page>
    <template #toolbar v-if="!isSelf">
      <div class="flex items-center justify-between gap-4">
        <span class="text-lg ms-4 font-semibold">{{
            isNew ? 'Новый пользователь' : `${form.lastName} ${form.firstName}`
          }}</span>
        <div class="flex items-center gap-2">
          <UButton
              v-if="canViewAs"
              icon="i-lucide-eye"
              label="Посмотреть как пользователь"
              @click="viewAs"
          />
          <UButton
              v-if="!isNew && isClientAccount"
              icon="i-lucide-trash-2"
              label="Удалить"
              class="w-[130px] justify-center"
              @click="deleteOpen = true"
          />
          <UButton v-else
                   class="w-32 justify-center"
                   v-if="!isNew && !isSelf"
                   label="Удалить"
                   @click="remove"
          />
        </div>
      </div>
    </template>
    <Panel>
      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Логин" required>
            <UInput v-model="form.username" class="w-full"/>
          </UFormField>
          <UFormField label="Email" required>
            <UInput v-model="form.email" type="email" class="w-full"/>
          </UFormField>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Имя">
            <UInput v-model="form.firstName" class="w-full"/>
          </UFormField>
          <UFormField label="Фамилия">
            <UInput v-model="form.lastName" class="w-full"/>
          </UFormField>
        </div>

        <UFormField
            label="Пароль"
            :error="errors.password"
            :required="isNew"
            :hint="isNew ? undefined : 'Оставьте пустым, чтобы не менять'">
          <!--          <UInput v-model="form.password" type="password" autocomplete="new-password" class="w-full" />-->
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
                  @click="showPasswd = !showPasswd"/>
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Роли" required>
          <USelect v-model="form.roles" :items="roleOptions" multiple class="w-full" :disabled="isClientAccount"/>
        </UFormField>

        <USwitch
            v-model="form.isActive"
            :label="form.isActive ? 'Учётная запись активна' : 'Учётная запись отключена'"
            :disabled="isSelf"
        />
        <p v-if="isSelf" class="text-xs text-dimmed">
          Нельзя отключить самого себя.
        </p>
      </div>
    </Panel>
    <template #footer>
      <FormActions
          :is-dirty="isDirty"
          :saving="saving"
          :disabled="!canSave"
          :close-to="closeTo"
          @save="save"
          @reset="reset"
      />
    </template>
  </Page>
  <UModal v-model:open="deleteOpen" title="Удалить безвозвратно">
    <template #body>
      <div class="space-y-4">
        <p class="text-sm">
          Учётная запись <b>{{ form?.username }}</b> будет удалена немедленно,
          вместе с историей чтения и избранным. Отметки авторов об этом клиенте сохранятся.
          Действие необратимо.
        </p>

        <div class="flex justify-end gap-2">
          <UButton label="Отмена" class="w-[130px] justify-center" @click="deleteOpen = false"/>
          <UButton label="Удалить" class="w-[130px] justify-center" @click="confirmDelete"/>
        </div>
      </div>
    </template>
  </UModal>
</template>