<script setup lang="ts">
import {TRASH_DAYS, TRASH_LABEL, TRASH_WARN_DAYS, trashDaysLeft, type TrashItem, type TrashKind} from '~~/shared/constants/trash'

// Список «Удалённых» одного вида: поиск, отметки, «Восстановить» и «Удалить навсегда».
// Не знает, что внутри, — получает вид (kind) и контекст (goalId для этапов). Используется в TrashButton
const props = defineProps<{ kind: TrashKind; goalId?: string }>()
const emit = defineEmits<{ changed: []; close: [] }>()

const api = useApi()
const toast = useToast()
const tick = useTrashTick(props.kind)

const items = ref<TrashItem[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await api<{ items: TrashItem[] }>(`/api/trash/${props.kind}`, {query: {goalId: props.goalId}})
    items.value = res.items
    const alive = new Set(res.items.map(i => i.id))
    selected.value = new Set([...selected.value].filter(id => alive.has(id)))
  } catch (e: any) {
    toast.add({title: 'Не удалось загрузить удалённые', description: e?.data?.message, color: 'error'})
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Поиск и отметки ──
const search = ref('')
const shown = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? items.value.filter(i => `${i.title} ${i.context ?? ''}`.toLowerCase().includes(q)) : items.value
})

const selected = ref<Set<string>>(new Set())
const allShownSelected = computed(() => shown.value.length > 0 && shown.value.every(i => selected.value.has(i.id)))

function toggle(id: string) {
  const s = new Set(selected.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selected.value = s
}

function toggleAll() {
  const s = new Set(selected.value)
  if (allShownSelected.value) shown.value.forEach(i => s.delete(i.id))
  else shown.value.forEach(i => s.add(i.id))
  selected.value = s
}

// ── Действия ──
const busy = ref(false)
const confirmPurge = ref(false)

async function run(action: 'restore' | 'purge') {
  const ids = [...selected.value]
  if (!ids.length) return
  busy.value = true
  try {
    const res = await api<{ count: number }>(`/api/trash/${props.kind}/${action}`, {method: 'POST', body: {ids}})
    toast.add({
      title: action === 'restore' ? `Восстановлено: ${res.count}` : `Удалено навсегда: ${res.count}`,
      color: action === 'restore' ? 'success' : 'neutral',
      duration: 3000,
    })
    selected.value = new Set()
    confirmPurge.value = false
    tick.value++
    emit('changed')
    await load()
    if (!items.value.length) emit('close')
  } catch (e: any) {
    toast.add({title: 'Не получилось', description: e?.data?.message, color: 'error'})
  } finally {
    busy.value = false
  }
}

watch(selected, () => (confirmPurge.value = false))

const rtf = new Intl.RelativeTimeFormat('ru', {numeric: 'auto'})

function deletedAgo(iso: string) {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000)
  if (days < 1) return 'удалено сегодня'
  return `удалено ${rtf.format(-days, 'day')}`
}
</script>

<template>
  <div class="flex flex-col min-h-0 gap-2">
    <div class="flex items-center gap-2">
      <span class="font-medium text-highlighted flex-1">{{ TRASH_LABEL[kind].title }} · {{ items.length }}</span>
      <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Закрыть" @click="emit('close')"/>
    </div>

    <UInput v-model="search" icon="i-lucide-search" placeholder="Поиск" class="w-full" @keydown.esc.stop="search = ''"/>

    <div class="flex items-center gap-2 px-1 text-xs text-dimmed">
      <UCheckbox
          :model-value="allShownSelected"
          :disabled="!shown.length"
          label="Выбрать все"
          @update:model-value="toggleAll"
      />
      <span class="ms-auto">удаляются навсегда через {{ TRASH_DAYS }} дней</span>
    </div>

    <div class="min-h-0 max-h-[50vh] overflow-y-auto divide-y divide-default border-y border-default">
      <p v-if="loading && !items.length" class="py-6 text-center text-sm text-dimmed">Загрузка…</p>
      <p v-else-if="!items.length" class="py-6 text-center text-sm text-dimmed">Удалённых нет.</p>
      <p v-else-if="!shown.length" class="py-6 text-center text-sm text-dimmed">Ничего не найдено.</p>
      <label
          v-for="item in shown"
          :key="item.id"
          class="flex items-center gap-3 px-1 py-2 cursor-pointer hover:bg-elevated/60"
      >
        <UCheckbox :model-value="selected.has(item.id)" @update:model-value="toggle(item.id)"/>
        <span class="flex-1 min-w-0">
          <span class="block truncate text-sm text-default">{{ item.title }}</span>
          <span class="block truncate text-xs text-dimmed">
            <template v-if="item.context">{{ item.context }} · </template>{{ deletedAgo(item.deletedAt) }}
          </span>
        </span>
        <span
            class="shrink-0 text-xs tabular-nums"
            :class="trashDaysLeft(item.deletedAt) <= TRASH_WARN_DAYS ? 'text-warning' : 'text-dimmed'"
            title="Дней до удаления навсегда"
        >{{ trashDaysLeft(item.deletedAt) }} дн.</span>
      </label>
    </div>

    <!-- Подтверждение «Удалить навсегда» — прямо в списке, без окна поверх окна -->
    <div
        v-if="confirmPurge"
        class="flex items-center gap-2 rounded-xs ring ring-inset ring-default bg-elevated/60 px-3 py-2 text-sm"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0 text-warning"/>
      <span class="flex-1">Удалить навсегда: {{ selected.size }}? Это нельзя отменить.</span>
      <UButton label="Отмена" color="neutral" variant="outline" size="sm" @click="confirmPurge = false"/>
      <UButton label="Удалить" color="neutral" size="sm" :loading="busy" @click="run('purge')"/>
    </div>

    <div v-else class="flex justify-end gap-2">
      <UButton
          label="Удалить навсегда"
          color="neutral"
          variant="outline"
          class="w-[130px] justify-center"
          :disabled="!selected.size || busy"
          @click="confirmPurge = true"
      />
      <UButton
          :label="selected.size ? `Восстановить · ${selected.size}` : 'Восстановить'"
          color="neutral"
          class="min-w-[130px] justify-center"
          :disabled="!selected.size"
          :loading="busy"
          @click="run('restore')"
      />
    </div>
  </div>
</template>
