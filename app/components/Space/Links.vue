<script setup lang="ts">
const api = useApi()

const props = defineProps<{ spaceId: string }>()
const toast = useToast()

interface AccessLink {
  id: string
  token: string
  label: string | null
  expiresAt: string | null
  revokedAt: string | null
  lastSeenAt: string | null
  viewCount: number
  createdAt: string
}

const { data, refresh } = await useFetch<AccessLink[]>(
    () => `/api/spaces/${props.spaceId}/links`,
)

const links = computed(() => data.value ?? [])

const showRevoked = ref(false)

const activeLinks = computed(() => links.value.filter(l => !l.revokedAt))
const revokedLinks = computed(() => links.value.filter(l => l.revokedAt))

const visibleLinks = computed(() =>
    showRevoked.value ? revokedLinks.value : activeLinks.value,
)

const createOpen = ref(false)
const newLabel = ref('')
const newExpires = ref('')

const requestURL = useRequestURL()
const config = useRuntimeConfig()

function linkUrl(token: string) {
  const base = config.public.siteUrl || requestURL.origin
  return `${base}/view/${token}`
}

async function create() {
  try {
    await api(`/api/spaces/${props.spaceId}/links`, {
      method: 'POST',
      body: {
        label: newLabel.value || undefined,
        expiresAt: newExpires.value ? new Date(newExpires.value).toISOString() : null,
      },
    })
    newLabel.value = ''
    newExpires.value = ''
    createOpen.value = false
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Не удалось создать ссылку', description: e?.data?.message, color: 'error' })
  }
}

async function revoke(link: AccessLink) {
  try {
    await api(`/api/spaces/${props.spaceId}/links/${link.id}/revoke`, { method: 'POST' })
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Не удалось отозвать', description: e?.data?.message, color: 'error' })
  }
}

async function copy(token: string) {
  await navigator.clipboard.writeText(linkUrl(token))
  toast.add({ title: 'Ссылка скопирована', color: 'success' })
}

function isExpired(link: AccessLink) {
  return !!link.expiresAt && new Date(link.expiresAt) < new Date()
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('ru') : '—'
}
</script>

<template>
  <SectionPanel title="Ссылки для клиентов">
    <template #actions>
      <div class="flex items-center justify-between gap-4">
        <USwitch
            v-if="revokedLinks.length"
            v-model="showRevoked"
            :label="`Отозванные (${revokedLinks.length})`"
            size="sm"
        />
        <UButton
            icon="i-lucide-plus"
            size="lg"
            @click="createOpen = true"/>
      </div>
    </template>

    <p v-if="!visibleLinks.length" class="text-muted text-sm">
      {{ activeLinks.length ? 'Все ссылки отозваны.' : 'Ссылок пока нет. Создайте ссылку и отправьте её клиенту.' }}
    </p>

    <ul v-else class="divide-y divide-default">
      <li v-for="link in visibleLinks" :key="link.id" class="py-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium">{{ link.label || 'Без подписи' }}</span>
              <UBadge v-if="link.revokedAt" label="Отозвана" color="error" variant="subtle" size="sm" />
              <UBadge v-else-if="isExpired(link)" label="Истекла" color="primary" variant="subtle" size="sm" />
              <UBadge v-else label="Активна" color="success" variant="subtle" size="sm" />
            </div>

            <p class="text-xs text-dimmed mt-1 break-all">{{ linkUrl(link.token) }}</p>

            <p class="text-xs text-dimmed mt-1">
              Переходов: {{ link.viewCount }} · Последний: {{ formatDate(link.lastSeenAt) }}
              <template v-if="link.expiresAt"> · Действует до {{ formatDate(link.expiresAt) }}</template>
            </p>
          </div>

          <div class="flex gap-1 shrink-0">
            <UButton
                icon="i-lucide-copy"
                size="xs"
                color="neutral"
                variant="ghost"
                :disabled="!!link.revokedAt"
                @click="copy(link.token)"
            />
            <UButton
                v-if="!link.revokedAt"
                icon="i-lucide-ban"
                size="xs"
                color="error"
                variant="ghost"
                @click="revoke(link)"
            />
          </div>
        </div>
      </li>
    </ul>

    <UModal v-model:open="createOpen" title="Новая ссылка">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Подпись" hint="Чтобы понимать, кому выдана">
            <UInput v-model="newLabel" placeholder="Например: Иванову" class="w-full" />
          </UFormField>

          <UFormField label="Действует до" hint="Необязательно">
            <UInput v-model="newExpires" type="date" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton label="Отмена" color="neutral" variant="ghost" @click="createOpen = false" />
            <UButton label="Создать" @click="create" />
          </div>
        </div>
      </template>
    </UModal>
  </SectionPanel>
</template>