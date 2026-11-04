<script setup lang="ts">
import {useUserStore} from "~~/stores/user.ts";

const route = useRoute()
const api = useApi()
const toast = useToast()
const {user} = storeToRefs(useUserStore())

const clientId = route.params.id as string

interface ClientDetail {
  id: string
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  createdAt: string
  clientMarks: {
    comment: string | null
    createdAt: string
    author: { id: string; firstName: string | null; lastName: string | null; username: string }
  }[]
  clientLibrary: {
    comment: string | null
    assignedAt: string | null
    readAt: string | null
    favoritedAt: string | null
    article: { id: string; title: string; slug: string; area: { name: string } }
    assignedBy: { id: string; firstName: string | null; lastName: string | null } | null
  }[]
  deletionRequestedAt: string | null
}

const {data, refresh} = await useFetch<ClientDetail>(`/api/clients/${clientId}`)

const client = computed(() => data.value)

const myMark = computed(() =>
    client.value?.clientMarks.find(m => m.author.id === user.value?.id) ?? null,
)

const otherMarks = computed(() =>
    client.value?.clientMarks.filter(m => m.author.id !== user.value?.id) ?? [],
)

function fullName(person: { firstName: string | null; lastName: string | null; username?: string }) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ')
      || person.username
      || ''
}

const markOpen = ref(false)
const markComment = ref('')

function openMark() {
  markComment.value = myMark.value?.comment ?? ''
  markOpen.value = true
}

async function saveMark() {
  try {
    await api(`/api/clients/${clientId}/mark`, {
      method: 'POST',
      body: {comment: markComment.value},
    })
    await refresh()
    markOpen.value = false
  } catch (e: any) {
    toast.add({title: 'Не удалось сохранить', description: e?.data?.message, color: 'error'})
  }
}

async function removeMark() {
  try {
    await api(`/api/clients/${clientId}/mark`, {method: 'POST', body: {}})
    await refresh()
    markOpen.value = false
  } catch (e: any) {
    toast.add({title: 'Не удалось снять отметку', description: e?.data?.message, color: 'error'})
  }
}

const pickerOpen = ref(false)
const pickerSearch = ref('')
const pickerComment = ref('')
const selectedIds = ref<string[]>([])
const assigning = ref(false)

const {data: available} = await useFetch<{
  items: { id: string; title: string; isStarter?: boolean; area: { name: string } }[]
}>(
    '/api/articles',
    {
      query: computed(() => ({search: pickerSearch.value, status: 'READY', limit: 20})),
      watch: [pickerSearch],
    },
)

// Не показываем уже назначенные и статьи стартового набора (они и так доступны всем)
const candidates = computed(() => {
  const present = new Set(
      client.value?.clientLibrary.filter(l => l.assignedAt).map(l => l.article.id) ?? [],
  )
  return (available.value?.items ?? []).filter(a => !present.has(a.id) && !a.isStarter)
})

function isSelected(id: string) {
  return selectedIds.value.includes(id)
}

function toggleSelected(id: string) {
  selectedIds.value = isSelected(id)
      ? selectedIds.value.filter(x => x !== id)
      : [...selectedIds.value, id]
}

// Каждый раз открываем окно с чистого листа
watch(pickerOpen, (open) => {
  if (!open) return
  selectedIds.value = []
  pickerComment.value = ''
  pickerSearch.value = ''
})

async function assign() {
  if (!selectedIds.value.length) return

  assigning.value = true
  const ids = [...selectedIds.value]
  const comment = pickerComment.value.trim() || undefined

  const results = await Promise.allSettled(
      ids.map(articleId =>
          api(`/api/clients/${clientId}/articles`, {
            method: 'POST',
            body: {articleId, comment},
          }),
      ),
  )

  await refresh()
  assigning.value = false

  const failedIds = ids.filter((_, i) => results[i]?.status === 'rejected')
  const done = ids.length - failedIds.length

  if (!failedIds.length) {
    pickerOpen.value = false
    toast.add({
      title: done === 1 ? 'Статья назначена' : `Назначено статей: ${done}`,
      color: 'success',
    })
    return
  }

  // Неудачные оставляем выбранными, чтобы можно было повторить
  selectedIds.value = failedIds
  const first = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
  toast.add({
    title: `Назначено ${done} из ${ids.length}`,
    description: first?.reason?.data?.message,
    color: 'warning',
  })
}

async function unassign(articleId: string) {
  try {
    await api(`/api/clients/${clientId}/articles/${articleId}`, {method: 'DELETE'})
    await refresh()
  } catch (e: any) {
    toast.add({title: 'Не удалось убрать', description: e?.data?.message, color: 'error'})
  }
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('ru') : '—'
}

const deletionDate = computed(() => {
  const requested = client.value?.deletionRequestedAt
  if (!requested) return ''
  const date = new Date(requested)
  date.setDate(date.getDate() + 30)
  return date.toLocaleDateString('ru')
})

import type {PageTab} from '~~/shared/types/page'

const tabs = computed<PageTab[]>(() => [
  {
    value: 'info',
    label: 'Информация',
    icon: 'i-lucide-info',
    footer: true,
  },
  {
    value: 'articles',
    label: 'Статьи клиента',
    icon: 'i-lucide-users',
    footer: true,
  },
])
</script>

<template>
  <Page v-if="client" :tabs=tabs>

    <template #toolbar>
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold ms-4">{{ fullName(client) }}</h1>
        <UAlert
            v-if="client.deletionRequestedAt"
            icon="i-lucide-alert-triangle"
            title="Клиент запросил удаление"
            :description="`Учётная запись и вся история чтения будут удалены ${deletionDate}. Если клиент войдёт в систему, запрос отменится.`"
            color="neutral"
            variant="subtle"
        />
        <UBadge v-if="myMark" label="Мой клиент" color="neutral" variant="subtle" size="sm"/>
        <UButton
            :label="myMark ? 'Изменить отметку' : 'Отметить'"
            class="w-[150px] justify-center ms-auto"
            @click="openMark"
        />
      </div>
    </template>


    <template #default="{ tab }">
      <Panel v-if="tab === 'info'">
        <div class="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p class="text-dimmed text-xs">Email</p>
            <p>{{ client.email }}</p>
          </div>
          <div>
            <p class="text-dimmed text-xs">Зарегистрирован</p>
            <p>{{ formatDate(client.createdAt) }}</p>
          </div>
        </div>

        <div v-if="myMark?.comment" class="mt-4 border-l-2 border-default pl-3 text-sm">
          <p class="text-dimmed text-xs mb-1">Моя заметка</p>
          {{ myMark.comment }}
        </div>

        <div v-if="otherMarks.length" class="mt-4 space-y-2">
          <p class="text-dimmed text-xs">Отметили другие</p>
          <div
              v-for="mark in otherMarks"
              :key="mark.author.id"
              class="border-l-2 border-default pl-3 text-sm"
          >
            <p class="text-toned">{{ mark.comment || 'без заметки' }}</p>
            <p class="text-xs text-dimmed mt-0.5">{{ fullName(mark.author) }}</p>
          </div>
        </div>
      </Panel>

      <SectionPanel title="Назначенные статьи" v-else-if="tab === 'articles'">
        <template #actions>
          <UButton icon="i-lucide-plus" label="Назначить" size="sm" @click="pickerOpen = true"/>
        </template>

        <p v-if="!client.clientLibrary.length" class="text-muted text-sm">
          Пока ничего не назначено. Клиенту доступны только материалы для ознакомления.
        </p>

        <ul v-else class="divide-y divide-default">
          <li
              v-for="link in client.clientLibrary"
              :key="link.article.id"
              class="flex items-start justify-between gap-3 py-2.5"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <NuxtLink :to="`/articles/${link.article.id}/view`" class="hover:underline">
                  {{ link.article.title }}
                </NuxtLink>
                <UBadge v-if="link.readAt" label="Прочитана" color="neutral" variant="subtle" size="sm"/>
                <UIcon v-if="link.favoritedAt" name="i-lucide-star" class="size-4 text-toned"/>
              </div>

              <p class="text-xs text-dimmed mt-0.5">
                {{ link.article.area.name }} · назначена {{ formatDate(link.assignedAt) }}
                <template v-if="link.assignedBy"> · {{ fullName(link.assignedBy) }}</template>
              </p>

              <p v-if="link.comment" class="text-sm text-toned mt-1.5 border-l-2 border-default pl-3">
                {{ link.comment }}
              </p>
            </div>

            <UButton
                icon="i-lucide-x"
                size="xs"
                class="shrink-0"
                @click="unassign(link.article.id)"
            />
          </li>
        </ul>
      </SectionPanel>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <UButton label="Закрыть" class="w-[130px] justify-center" to="/clients"/>
      </div>
    </template>
  </Page>

  <UModal v-model:open="markOpen" title="Отметка о клиенте">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Заметка" hint="Почему вы отмечаете этого клиента">
          <UTextarea v-model="markComment" :rows="4" class="w-full"/>
        </UFormField>

        <div class="flex justify-between gap-2">
          <UButton
              v-if="myMark"
              label="Снять отметку"
              class="w-[150px] justify-center"
              @click="removeMark"
          />
          <div v-else/>

          <div class="flex gap-2">
            <UButton label="Отмена" class="w-[130px] justify-center" @click="markOpen = false"/>
            <UButton label="Сохранить" class="w-[130px] justify-center" @click="saveMark"/>
          </div>
        </div>
      </div>
    </template>
  </UModal>

  <UModal v-model:open="pickerOpen" title="Назначить статьи">
    <template #body>
      <div class="space-y-4">
        <UInput
            v-model="pickerSearch"
            placeholder="Поиск по названию"
            icon="i-lucide-search"
            class="w-full"
        />

        <p v-if="!candidates.length" class="text-muted text-sm">Ничего не найдено</p>

        <ul v-else class="divide-y divide-default max-h-64 overflow-y-auto">
          <li
              v-for="article in candidates"
              :key="article.id"
              class="flex items-center justify-between gap-3 py-2 cursor-pointer hover:bg-sub-200/40"
              :class="isSelected(article.id) ? 'bg-sub-200/60' : ''"
              @click="toggleSelected(article.id)"
          >
            <div class="min-w-0 px-2">
              <span>{{ article.title }}</span>
              <p class="text-xs text-dimmed">{{ article.area.name }}</p>
            </div>
            <UIcon
                v-if="isSelected(article.id)"
                name="i-lucide-check"
                class="size-4 shrink-0 mr-2"
            />
          </li>
        </ul>

        <UFormField
            label="Комментарий"
            :hint="selectedIds.length > 1 ? 'Будет добавлен ко всем выбранным статьям' : 'Клиент увидит его рядом со статьёй'"
        >
          <UTextarea v-model="pickerComment" :rows="3" class="w-full"/>
        </UFormField>

        <div class="flex items-center justify-between gap-2">
          <div class="text-sm text-toned">
            <template v-if="selectedIds.length">
              Выбрано: {{ selectedIds.length }}
              <button type="button" class="ms-2 underline text-dimmed hover:text-highlighted" @click="selectedIds = []">
                снять
              </button>
            </template>
          </div>

          <div class="flex gap-2">
            <UButton label="Отмена" class="w-[130px] justify-center" @click="pickerOpen = false"/>
            <UButton
                label="Назначить"
                class="w-[130px] justify-center"
                :loading="assigning"
                :disabled="!selectedIds.length"
                @click="assign"
            />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>