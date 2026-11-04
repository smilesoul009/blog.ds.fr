<script setup lang="ts">
import {useUserStore} from "~~/stores/user.ts";

const props = defineProps<{ profileTo: string; notificationsTo?: string }>()
const store = useUserStore()

const fullName = computed(() => {
  const u = store.user
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username
})

const viewAs = computed(() => store.user?.viewAs ?? null)

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
let stopping = false

const expiresMs = computed(() => {
  const e = viewAs.value?.expiresAt
  if (!e) return 0
  return e < 1e12 ? e * 1000 : e
})

const leftText = computed(() => {
  const left = Math.max(0, Math.floor((expiresMs.value - now.value) / 1000))
  const m = Math.floor(left / 60)
  const s = left % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
    if (viewAs.value && !stopping && now.value >= expiresMs.value) {
      stopping = true
      store.stopViewAs()
    }
  }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const items = computed(() => {
  if (viewAs.value) {
    return [
      [{ label: `Автовыход через: ${leftText.value}`, icon: 'i-lucide-timer', type: 'label' as const }],
      [
        { label: 'Профиль', icon: 'i-lucide-user-circle', to: props.profileTo },
        { label: 'Выйти из просмотра', icon: 'i-lucide-log-out', onSelect: () => store.stopViewAs() },
      ],
    ]
  }
  return [[
    { label: 'Профиль', icon: 'i-lucide-user-circle', to: props.profileTo },
    ...(props.notificationsTo ? [{ label: 'Уведомления', icon: 'i-lucide-bell', to: props.notificationsTo }] : []),
    { label: 'Выйти', icon: 'i-lucide-log-out', onSelect: () => store.logout() },
  ]]
})
</script>

<template>
  <UDropdownMenu :items="items" :ui="{ content: 'min-w-[var(--reka-dropdown-menu-trigger-width)]' }">
    <button
        type="button"
        class="nav-tab-right"
        :class="viewAs && 'view-as-tab'"
        :title="viewAs ? 'Режим просмотра' : undefined"
    >
      <UIcon :name="viewAs ? 'i-lucide-eye' : 'i-lucide-user'" class="size-4 shrink-0" />
      <span class="hidden sm:inline max-w-[160px] truncate">{{ fullName }}</span>
      <UIcon name="i-lucide-chevron-down" class="size-4 shrink-0 hidden sm:block" />
    </button>
  </UDropdownMenu>
</template>

<style scoped>
.view-as-tab {
  border-left: 8px solid var(--color-amber-400) !important;
}
</style>