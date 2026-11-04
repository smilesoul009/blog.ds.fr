<script setup lang="ts">
import type { Role } from '@prisma/client'
import { ROLE_LABELS } from '~~/shared/constants/enums'
import {usePermissions} from "~~/composables/usePermissions.ts";

const props = defineProps<{ areaId: string }>()
const api = useApi()
const toast = useToast()
const { can } = usePermissions()

interface Member {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  roles: Role[]
  isActive: boolean
  isOwner: boolean
}

const { data, refresh, status } = await useFetch<Member[]>(
    () => `/api/areas/${props.areaId}/users`,
)

const members = computed(() => data.value ?? [])
const owner = computed(() => members.value.find(m => m.isOwner) ?? null)

const pickerOpen = ref(false)
const pickerSearch = ref('')
const confirmOpen = ref(false)

const { data: available } = await useFetch<{ items: Member[] }>('/api/users', {
  query: computed(() => ({ search: pickerSearch.value, limit: 20 })),
  watch: [pickerSearch],
})

const candidates = computed(() => {
  const present = new Set(members.value.map(m => m.id))
  return (available.value?.items ?? []).filter(u => !present.has(u.id))
})

function fullName(user: Member) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
}

async function add(userId: string) {
  try {
    await api(`/api/areas/${props.areaId}/users`, { method: 'POST', body: { userId } })
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Не удалось добавить', description: e?.data?.message, color: 'error' })
  }
}

async function remove(userId: string) {
  try {
    await api(`/api/areas/${props.areaId}/users/${userId}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Не удалось убрать', description: e?.data?.message, color: 'error' })
  }
}

async function setOwner(userId: string | null) {
  try {
    await api(`/api/areas/${props.areaId}/owner`, { method: 'POST', body: { userId } })
    await refresh()
    toast.add({
      title: userId ? 'Владелец назначен' : 'Владение снято',
      color: 'success',
    })
  } catch (e: any) {
    toast.add({ title: 'Не удалось изменить', description: e?.data?.message, color: 'error' })
  }
}

function onOwnerToggle(member: Member, value: boolean) {
  if (value) {
    setOwner(member.id)
  } else {
    confirmOpen.value = true
  }
}

async function confirmRemoveOwner() {
  confirmOpen.value = false
  await setOwner(null)
}
</script>

<template>
  <SectionPanel title="Участники направления">
    <template #actions>
      <UButton
          v-if="can('area:manage')"
          icon="i-lucide-plus"
          label="Добавить"
          size="sm"
          @click="pickerOpen = true"
      />
    </template>

    <p v-if="status === 'pending'" class="text-muted text-sm">Загрузка...</p>
    <p v-else-if="!members.length" class="text-muted text-sm">
      Пока никого нет. Добавьте авторов, которые смогут писать статьи в этом направлении.
    </p>

    <ul v-else class="divide-y divide-default">
      <li
          v-for="member in members"
          :key="member.id"
          class="flex items-center justify-between gap-3 py-2.5"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span>{{ fullName(member) }}</span>
            <UBadge
                v-if="!member.isActive"
                label="Отключён"
                color="neutral"
                variant="subtle"
                size="sm"
            />
          </div>
          <p class="text-xs text-dimmed mt-0.5">
            {{ member.roles.map(r => ROLE_LABELS[r]).join(', ') }}
          </p>
        </div>

        <div class="flex items-center gap-4 shrink-0">
          <USwitch
              :model-value="member.isOwner"
              label="Владелец"
              size="sm"
              :disabled="!can('area:manage') || (!!owner && !member.isOwner)"
              @update:model-value="v => onOwnerToggle(member, v)"
          />

          <UButton
              v-if="can('area:manage')"
              icon="i-lucide-x"
              size="xs"
              :disabled="member.isOwner"
              @click="remove(member.id)"
          />
        </div>
      </li>
    </ul>

    <UModal v-model:open="pickerOpen" title="Добавить участника">
      <template #body>
        <div class="space-y-3">
          <UInput
              v-model="pickerSearch"
              placeholder="Поиск по имени или логину"
              icon="i-lucide-search"
              class="w-full"
          />

          <p v-if="!candidates.length" class="text-muted text-sm">Ничего не найдено</p>

          <ul v-else class="divide-y divide-default max-h-80 overflow-y-auto">
            <li
                v-for="user in candidates"
                :key="user.id"
                class="flex items-center justify-between gap-3 py-2"
            >
              <div class="min-w-0">
                <span>{{ fullName(user) }}</span>
                <p class="text-xs text-dimmed">{{ user.username }}</p>
              </div>
              <UButton label="Добавить" size="xs" @click="add(user.id)" />
            </li>
          </ul>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="confirmOpen" title="Снять владение">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm">
            {{ owner ? fullName(owner) : '' }} перестанет быть владельцем направления
            и потеряет право редактировать чужие статьи в нём.
            Участником направления он останется.
          </p>
          <div class="flex justify-end gap-2">
            <UButton label="Отмена" class="w-[130px] justify-center" @click="confirmOpen = false" />
            <UButton label="Снять" class="w-[130px] justify-center" @click="confirmRemoveOwner" />
          </div>
        </div>
      </template>
    </UModal>
  </SectionPanel>
</template>