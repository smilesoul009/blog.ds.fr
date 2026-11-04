<script setup lang="ts">
import {useCrudList} from "~/composables/useCrudList.ts";

interface Area {
  id: string
  name: string
  description: string | null
  _count: { articles: number; users: number }
}

const api = useApi()
const {items, search, pending, refresh} = useCrudList<Area>('/api/areas')
const toast = useToast()

const modalOpen = ref(false)
const editing = ref<Area | null>(null)
const form = reactive({name: '', description: ''})

function openCreate() {
  navigateTo('areas/new')
}

function openEdit(area: Area) {
  navigateTo(`/areas/${area.id}`)
}


async function remove(area: Area) {
  try {
    await api(`/api/areas/${area.id}`, {method: 'DELETE'})
    await refresh()
  } catch (e: any) {
    toast.add({title: 'Не удалось удалить', description: e?.data?.message, color: 'error'})
  }
}
</script>

<template>
  <Page>
    <template #header>
      <Header>Направления</Header>
    </template>
    <template #toolbar>
      <div class="flex justify-between">
        <UInput v-model="search" placeholder="Поиск" icon="i-lucide-search" class="max-w-xs"/>
        <UButton icon="i-lucide-plus" size="lg" @click="openCreate"/>
      </div>
    </template>

    <Panel v-if="pending">
      <p class="text-muted">Загрузка...</p>
    </Panel>

    <div v-else class="space-y-2">
      <ListRow v-for="area in items" :key="area.id" :to="`/areas/${area.id}`">
        <div class="flex items-center justify-start gap-4">
          <UIcon name="i-lucide-astroid" class="ms-2 size-7 text-toned"/>
          <USeparator orientation="vertical" class="h-12 " size="sm"/>
          <div>
            <p class="text-lg font-medium ">{{ area.name }}</p>
            <p class="text-xs text-highlighted mt-2">
              Статей: {{ area._count.articles }} · Участников: {{ area._count.users }}
            </p>
          </div>
        </div>
      </ListRow>
    </div>
  </Page>
</template>