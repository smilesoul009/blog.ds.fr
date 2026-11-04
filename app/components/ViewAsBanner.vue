<script setup lang="ts">
import { ROLE_LABELS } from '~~/shared/constants/enums'
import { useUserStore } from '~~/stores/user.ts'

const store = useUserStore()
const { user } = storeToRefs(store)

const name = computed(() =>
    [user.value?.firstName, user.value?.lastName].filter(Boolean).join(' ') || user.value?.username,
)
const roles = computed(() => (user.value?.roles ?? []).map(r => ROLE_LABELS[r]).join(', '))
const until = computed(() =>
    user.value?.viewAs
        ? new Date(user.value.viewAs.expiresAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
        : '',
)

const leaving = ref(false)
function leave() {
  leaving.value = true
  store.stopViewAs()
}
</script>

<template>
  <div
      v-if="user?.viewAs"
      class="shrink-0 m-2 mb-0 px-3 py-2 rounded-sm bg-amber-100/90 ring ring-inset ring-amber-300 flex items-center gap-3 text-sm"
  >
    <UIcon name="i-lucide-eye" class="size-5 shrink-0 text-amber-700" />
    <p class="flex-1 min-w-0 text-highlighted">
      Вы смотрите сайт как <b>{{ name }}</b> ({{ roles }}). Только просмотр — изменения не сохраняются.
      <ClientOnly><span class="text-toned">Режим действует до {{ until }}.</span></ClientOnly>
    </p>
    <UButton icon="i-lucide-log-out" label="Выйти" size="sm" :loading="leaving" @click="leave" />
  </div>
</template>