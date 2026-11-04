<script setup lang="ts">
import type {PageTab} from "#shared/types/page.ts";

const api = useApi()
const route = useRoute()
const router = useRouter()

const routeId = route.params.id as string
const isCreating = routeId === 'new'
const spaceId = ref(isCreating ? '' : routeId)

interface SpaceForm {
  name: string
  description: string
}

const {form, isNew, isDirty, saving, load, save, reset} =
    useEditableForm<SpaceForm>({
      initial: {name: '', description: ''},

      load: isCreating ? undefined : async () => {
        const data = await api<any>(`/api/spaces/${spaceId.value}`)
        return {name: data.name, description: data.description ?? ''}
      },

      create: (data) => api<{ id: string }>('/api/spaces', {method: 'POST', body: data}),

      update: (data) => api<string>(`/api/spaces/${spaceId.value}`, {method: 'PATCH', body: data}),

      onCreated: async (created) => {
        spaceId.value = created.id
        await router.replace(`/spaces/${created.id}`)
      },
    })

const toast = useToast()
const deleteOpen = ref(false)

async function remove() {
  try {
    await api(`/api/spaces/${spaceId.value}`, {method: 'DELETE'})
    toast.add({title: 'Подборка удалено', color: 'success'})
    await navigateTo('/spaces')
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

const tabs = computed<PageTab[]>(() => [
  {
    value: 'info',
    label: 'Информация',
    icon: 'i-lucide-info',
    footer: true,
  },
  {
    value: 'articles',
    label: 'Статьи',
    icon: 'i-lucide-users',
    footer: false,
    disabled: isNew.value,
  },
  {
    value: 'links',
    label: 'Ссылки',
    icon: 'i-lucide-users',
    footer: false,
    disabled: isNew.value,
  },

])

</script>

<template>
  <Page :tabs="tabs">
    <template #toolbar>
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-semibold ms-4">
            {{ isNew ? 'Новая подборка' : form.name || 'Подборка' }}
          </h1>
          <UBadge v-if="isDirty" label="Есть изменения" color="primary" variant="subtle" size="sm"/>
        </div>
        <UButton
            v-if="!isNew"
            icon="i-lucide-trash-2"
            label="Удалить"
            class="w-[130px] justify-center"
            @click="deleteOpen = true"/>
      </div>
    </template>
    <template #default="{tab}">
      <Panel v-if="tab === 'info'">
        <div class="space-y-4">
          <UFormField label="Название" required>
            <UInput v-model="form.name" class="w-full"/>
          </UFormField>
          <UFormField label="Описание">
            <UTextarea v-model="form.description" class="w-full"/>
          </UFormField>
        </div>
      </Panel>

      <SpaceArticles :space-id="spaceId" v-else-if="tab === 'articles'" />
      <SpaceLinks :space-id="spaceId" v-else-if="tab === 'links'"/>

    </template>
    <template #footer>
      <FormActions
          :is-dirty="isDirty"
          :saving="saving"
          :disabled="!form.name"
          close-to="/spaces"
          @save="save"
          @reset="reset"
      />
    </template>
  </Page>
  <UModal v-model:open="deleteOpen" title="Удалить подборку">
    <template #body>
      <div class="space-y-4">
        <p class="text-sm">
          Подборка «{{ form.name }}» будет удалена вместе со всеми ссылками доступа.
          Статьи останутся.
        </p>
        <div class="flex justify-end gap-2">
          <UButton label="Отмена" class="w-[130px] justify-center" @click="deleteOpen = false"/>
          <UButton label="Удалить" class="w-[130px] justify-center" @click="remove"/>
        </div>
      </div>
    </template>
  </UModal>
</template>