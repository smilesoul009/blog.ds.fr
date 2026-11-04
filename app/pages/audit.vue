<script setup lang="ts">
import type {AuditAction} from '@prisma/client'
import {AUDIT_ACTION_LABELS} from '~~/shared/constants/audit'
import {toOptions} from '~~/shared/constants/enums'

interface AuditEntry {
  id: string
  action: AuditAction
  entityType: string
  entityId: string
  entityName: string | null
  snapshot: any
  changes: Record<string, { from: any; to: any }> | null
  createdAt: string
  user: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
  } | null
}

const api = useApi()
const toast = useToast()

const actionFilter = ref(null)
const entityFilter = ref(null)
const page = ref(1)
const expanded = ref<string | null>(null)

const {data, refresh, status} = await useFetch<{
  items: AuditEntry[]
  total: number
  totalPages: number
}>('/api/audit', {
  query: computed(() => ({
    page: page.value,
    limit: 30,
    action: actionFilter.value || undefined,
    entityType: entityFilter.value || undefined,
  })),
})

const items = computed(() => data.value?.items ?? [])

const actionOptions = [
  {label: 'Все действия', value: null},
  ...toOptions(AUDIT_ACTION_LABELS),
]

const ENTITY_LABELS: Record<string, string> = {
  User: 'Пользователь',
  Area: 'Направление',
  Space: 'Подборка',
  Article: 'Статья',
}

const ACTION_ICONS: Record<AuditAction, string> = {
  CREATE: 'i-lucide-plus',
  UPDATE: 'i-lucide-pencil',
  DELETE: 'i-lucide-trash-2',
  RESTORE: 'i-lucide-corner-up-left',
  STATUS_CHANGE: 'i-lucide-arrow-right-left',
  LOGIN: 'i-lucide-log-in',
  BLOCK: 'i-lucide-lock',
  UNBLOCK: 'i-lucide-lock-open',
  VIEW_AS: 'i-lucide-eye',
}

const FIELD_LABELS: Record<string, string> = {
  username: 'Логин',
  email: 'Email',
  firstName: 'Имя',
  lastName: 'Фамилия',
  roles: 'Роли',
  isActive: 'Активна',
  name: 'Название',
  description: 'Описание',
  title: 'Заголовок',
  slug: 'Адрес',
  status: 'Статус',
  areaId: 'Направление',
  ownerId: 'Владелец',
}

const ENTITY_ICONS: Record<string, string> = {
  User: 'i-lucide-users',
  Area: 'i-lucide-astroid',
  Space: 'i-lucide-files',
  Article: 'i-lucide-file-text',
}

const entityOptions = [
  {label: 'Все объекты', value: null},
  ...Object.entries(ENTITY_LABELS).map(([value, label]) => ({label, value})),
]

function actorName(entry: AuditEntry) {
  if (!entry.user) return 'Система'
  return [entry.user.firstName, entry.user.lastName].filter(Boolean).join(' ')
      || entry.user.username
}

function fieldLabel(key: string) {
  return FIELD_LABELS[key] ?? key
}

function formatValue(value: any) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'да' : 'нет'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function hasDetails(entry: AuditEntry) {
  return !!entry.changes && Object.keys(entry.changes).length > 0
}

function canRestore(entry: AuditEntry) {
  return entry.action === 'DELETE'
      && !!entry.snapshot
      && ['User', 'Area', 'Space'].includes(entry.entityType)
}

function toggle(entry: AuditEntry) {
  if (!hasDetails(entry)) return
  expanded.value = expanded.value === entry.id ? null : entry.id
}

async function restore(entry: AuditEntry) {
  try {
    await api(`/api/audit/${entry.id}/restore`, {method: 'POST'})
    toast.add({title: 'Объект восстановлен', color: 'success'})
    await refresh()
  } catch (e: any) {
    toast.add({
      title: 'Не удалось восстановить',
      description: e?.data?.message,
      color: 'error',
    })
  }
}
</script>

<template>
  <Page>
    <template #header>
      <Header>Журнал аудита</Header>
    </template>
    <template #toolbar>
      <div class="flex flex-wrap gap-3 shrink-0">
        <USelect v-model="actionFilter" :items="actionOptions" class="w-48"/>
        <USelect v-model="entityFilter" :items="entityOptions" class="w-48"/>
      </div>
    </template>
    <p v-if="status === 'pending'" class="text-muted">Загрузка...</p>
    <p v-else-if="!items.length" class="text-muted">Записей нет</p>

    <div v-else
         class="flex-1 min-h-0 flex flex-col bg-white/70 ring ring-inset ring-default rounded-sm overflow-hidden text-sm">
      <div class="grid grid-cols-[26px_132px_150px_150px_1fr_150px_110px] items-center gap-2.5 px-3 pt-4 pb-3
                bg-sub-200/75 border-b border-default font-semibold text-highlighted">
        <span/>
        <span>Дата</span>
        <span>Действие</span>
        <span>Тип</span>
        <span>Объект</span>
        <span>Пользователь</span>
        <span/>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto">
        <template v-for="entry in items" :key="entry.id">
          <div
              class="grid grid-cols-[26px_132px_150px_150px_1fr_150px_110px] items-center gap-2.5 px-3 py-2 border-b border-muted hover:bg-sub-100/60"
              :class="[
            hasDetails(entry) ? 'cursor-pointer' : '',
            expanded === entry.id ? 'bg-sub-100/80' : '',
          ]"
              @click="toggle(entry)"
          >
            <UIcon
                v-if="hasDetails(entry)"
                :name="expanded === entry.id ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                class="size-4 text-muted"
            />
            <span v-else/>

            <span class="text-muted">{{ formatDate(entry.createdAt) }}</span>
            <span class="flex items-center gap-1.5 text-toned">
                <UIcon :name="ACTION_ICONS[entry.action]" class="size-4 shrink-0"/>
                    {{ AUDIT_ACTION_LABELS[entry.action] }}
           </span>
            <span class="flex items-center gap-1.5 text-toned">
              <UIcon
                  v-if="ENTITY_ICONS[entry.entityType]"
                  :name="ENTITY_ICONS[entry.entityType]"
                  class="size-4 shrink-0"
              />
              {{ ENTITY_LABELS[entry.entityType] ?? entry.entityType }}
            </span>
            <span class="truncate">{{ entry.entityName ?? entry.entityId }}</span>
            <span class="text-toned truncate">{{ actorName(entry) }}</span>

            <UButton
                v-if="canRestore(entry)"
                icon="i-lucide-corner-up-left"
                label="Вернуть"
                size="xs"
                @click.stop="restore(entry)"
            />
            <span v-else/>
          </div>

          <div
              v-if="expanded === entry.id && entry.changes"
              class="bg-sub-100/80 border-b border-muted px-3 pb-3 pt-1 pl-12"
          >
            <table class="w-full text-xs">
              <thead>
              <tr class="text-muted text-left">
                <th class="font-normal py-1 pr-4 w-40">Поле</th>
                <th class="font-normal py-1 pr-4">Было</th>
                <th class="font-normal py-1">Стало</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(diff, key) in entry.changes" :key="key">
                <td class="py-1 pr-4 text-toned">{{ fieldLabel(key) }}</td>
                <td class="py-1 pr-4 text-dimmed">{{ formatValue(diff.from) }}</td>
                <td class="py-1 text-highlighted">{{ formatValue(diff.to) }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>
    <template #footer v-if="(data?.totalPages ?? 0) > 1">
      <div class="flex justify-center px-3 py-2 bg-sub-200/75 shrink-0">
        <UPagination v-model:page="page" :total="data?.total ?? 0" :items-per-page="30"/>
      </div>
    </template>
  </Page>
</template>