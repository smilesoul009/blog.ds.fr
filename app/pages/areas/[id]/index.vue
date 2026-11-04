<script setup lang="ts">
import {usePermissions} from "~~/composables/usePermissions.ts";

const api = useApi()
const route = useRoute()
const router = useRouter()

const routeId = route.params.id as string
const isCreating = routeId === 'new'
const areaId = ref(isCreating ? '' : routeId)
const {can} = usePermissions()

import type {PageTab} from '~~/shared/types/page'

const tabs = computed<PageTab[]>(() => [
  {
    value: 'main',
    label: 'Основное',
    icon: 'i-lucide-info',
    badge: isDirty.value ? '•' : undefined,
  },
  {
    value: 'members',
    label: 'Участники',
    icon: 'i-lucide-users',
    disabled: isNew.value,
    footer: false,
  },
])

interface AreaForm {
  name: string
  description: string
}

const {form, isNew, isDirty, saving, load, save, reset} = useEditableForm<AreaForm>({
  initial: {name: '', description: ''},

  load: isCreating ? undefined : async () => {
    const data = await api<any>(`/api/areas/${areaId.value}`)
    return {name: data.name, description: data.description ?? ''}
  },

  create: (data) => api<{ id: string }>('/api/areas', {method: 'POST', body: data}),
  update: (data) => api<string>(`/api/areas/${areaId.value}`, {method: 'PATCH', body: data}),

  onCreated: async (created) => {
    areaId.value = created.id
    await router.replace(`/areas/${created.id}`)
  },
})

const toast = useToast()
const deleteOpen = ref(false)

async function remove() {
  try {
    await api(`/api/areas/${areaId.value}`, {method: 'DELETE'})
    toast.add({title: 'Направление удалено', color: 'success'})
    await navigateTo('/areas')
  } catch (e: any) {
    toast.add({
      title: 'Не удалось удалить',
      description: e?.data?.message,
      color: 'error',
    })
  } finally {
    deleteOpen.value = false
  }
}

if (!isCreating) await load()
</script>

<template>
  <Page card :tabs="tabs">
    <template #toolbar v-if="!isNew">
      <div class="flex items-center justify-between gap-4">
        <span class="text-lg ms-4 font-semibold">{{ isNew ? 'Новое направление' : form.name || 'Направление' }}</span>

        <UButton
            v-if="!isNew && can('area:manage')"
            icon="i-lucide-trash-2"
            label="Удалить"
            class="w-[130px] justify-center"
            @click="deleteOpen = true"
        />
      </div>
    </template>
    <template #default="{ tab }">
      <div class="space-y-4" v-if="tab === 'main'">
        <UFormField label="Название" required>
          <UInput v-model="form.name" class="w-full"/>
        </UFormField>
        <UFormField label="Описание" class="h-fit">
          <UTextarea v-model="form.description" class="w-full"/>
        </UFormField>
      </div>
      <template v-else-if="tab === 'members'">
        <AreaMembers v-if="!isNew" :area-id="areaId"/>
      </template>
    </template>
    <template #footer>
      <FormActions
          :is-dirty="isDirty"
          :saving="saving"
          :disabled="!form.name"
          close-to="/areas"
          @save="save"
          @reset="reset"
      />
    </template>
  </Page>
  <UModal v-model:open="deleteOpen" title="Удалить направление">
    <template #body>
      <div class="space-y-4">
        <p class="text-sm">
          Направление «{{ form.name }}» будет удалено. Это возможно, только если в нём
          нет статей и участников.
        </p>
        <div class="flex justify-end gap-2">
          <UButton label="Отмена" class="w-[130px] justify-center" @click="deleteOpen = false"/>
          <UButton label="Удалить" class="w-[130px] justify-center" @click="remove"/>
        </div>
      </div>
    </template>
  </UModal>
</template>