<script setup lang="ts">
import {NOTIFICATION_TYPES, notificationType} from '~~/shared/constants/notifications'

// Все уведомления: фильтры, поиск, просмотр сообщения, действия, удаление с отменой
interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  showAt: string
  readAt: string | null
}

const api = useApi()
const toast = useToast()
const route = useRoute()
const tick = useState('notifications-tick', () => 0)

const filter = ref<'all' | 'unread'>('all')
// Вид: 'all' — все (пустое значение USelect не принимает)
const type = ref('all')
const search = ref('')
const q = refDebounced(search, 300)

const items = ref<NotificationItem[]>([])
const nextCursor = ref<string | null>(null)
const total = ref(0)
const unread = ref(0)
const loading = ref(false)

async function load(more = false) {
  loading.value = true
  try {
    const res = await api<{ items: NotificationItem[]; nextCursor: string | null; total: number; unread: number }>(
        '/api/notifications/list',
        {
          query: {
            filter: filter.value,
            type: type.value === 'all' ? undefined : type.value,
            q: q.value || undefined,
            cursor: more ? nextCursor.value ?? undefined : undefined,
          },
        },
    )
    items.value = more ? [...items.value, ...res.items] : res.items
    nextCursor.value = res.nextCursor
    total.value = res.total
    unread.value = res.unread
  } catch (e: any) {
    toast.add({title: 'Не удалось загрузить уведомления', description: e?.data?.message, color: 'error'})
  } finally {
    loading.value = false
  }
}

watch([filter, type, q], () => {
  selected.value = new Set()
  load()
})

// ?open=id — открыть сообщение (переход из колокольчика), в том числе когда страница уже открыта
async function openFromQuery() {
  const id = route.query.open
  if (typeof id !== 'string') return
  if (!items.value.some(i => i.id === id)) await load()
  const n = items.value.find(i => i.id === id)
  if (n && openId.value !== id) openMessage(n)
}

onMounted(async () => {
  await load()
  openFromQuery()
})
watch(() => route.query.open, openFromQuery)

// ── Сообщение ──
const openId = ref<string | null>(null)

async function setRead(ids: string[], read: boolean) {
  for (const n of items.value) {
    if (!ids.includes(n.id) || !!n.readAt === read) continue
    n.readAt = read ? new Date().toISOString() : null
    unread.value += read ? -1 : 1
  }
  try {
    await api('/api/notifications/bulk', {method: 'POST', body: {ids, action: read ? 'read' : 'unread'}})
  } finally {
    tick.value++
  }
}

function openMessage(n: NotificationItem) {
  openId.value = openId.value === n.id ? null : n.id
  if (openId.value && !n.readAt) setRead([n.id], true)
}

async function follow(n: NotificationItem) {
  if (n.link) await navigateTo(n.link)
}

async function snooze(n: NotificationItem) {
  try {
    await api(`/api/notifications/${n.id}/snooze`, {method: 'POST'})
    toast.add({title: 'Напомню через 10 минут', color: 'neutral', duration: 3000})
    openId.value = null
    await load()
    tick.value++
  } catch (e: any) {
    toast.add({title: 'Не удалось отложить', description: e?.data?.message, color: 'error'})
  }
}

// ── Удаление с отменой: прячем сразу, удаляем через 5 секунд ──
const hidden = ref<Set<string>>(new Set())
let pending: { ids: string[]; timer: ReturnType<typeof setTimeout> } | null = null

function flushDelete(keepalive = false) {
  if (!pending) return
  const {ids, timer} = pending
  clearTimeout(timer)
  pending = null
  const body = JSON.stringify({ids, action: 'delete'})
  if (keepalive) {
    // Уход со страницы: запрос успеет уйти и после закрытия вкладки
    fetch('/api/notifications/bulk', {method: 'POST', keepalive: true, headers: {'Content-Type': 'application/json'}, body})
    return
  }
  api('/api/notifications/bulk', {method: 'POST', body: {ids, action: 'delete'}})
      .then(() => {
        items.value = items.value.filter(n => !ids.includes(n.id))
        total.value = Math.max(0, total.value - ids.length)
        tick.value++
      })
      .catch((e: any) => {
        restore(ids)
        toast.add({title: 'Не удалось удалить', description: e?.data?.message, color: 'error'})
      })
}

function restore(ids: string[]) {
  const h = new Set(hidden.value)
  ids.forEach(id => h.delete(id))
  hidden.value = h
}

function remove(ids: string[]) {
  if (!ids.length) return
  flushDelete()
  hidden.value = new Set([...hidden.value, ...ids])
  selected.value = new Set()
  if (openId.value && ids.includes(openId.value)) openId.value = null
  pending = {ids, timer: setTimeout(() => flushDelete(), 5000)}
  toast.add({
    title: ids.length === 1 ? 'Уведомление удалено' : `Удалено уведомлений: ${ids.length}`,
    color: 'warning',
    duration: 5000,
    actions: [{
      label: 'Отменить',
      icon: 'i-lucide-undo-2',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        if (!pending) return
        clearTimeout(pending.timer)
        restore(pending.ids)
        pending = null
      },
    }],
  })
}

onBeforeUnmount(() => flushDelete(true))
useEventListener(import.meta.client ? window : undefined, 'pagehide', () => flushDelete(true))

// ── Выделение ──
const selected = ref<Set<string>>(new Set())
const visible = computed(() => items.value.filter(n => !hidden.value.has(n.id)))
const allSelected = computed(() => visible.value.length > 0 && visible.value.every(n => selected.value.has(n.id)))

function toggle(id: string) {
  const s = new Set(selected.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selected.value = s
}

// «Выбрать все» — все уведомления по текущему фильтру: сначала догружаем остальные страницы
async function toggleAll() {
  if (allSelected.value && !nextCursor.value) return (selected.value = new Set())
  while (nextCursor.value) await load(true)
  selected.value = new Set(visible.value.map(n => n.id))
}

const selectedIds = computed(() => visible.value.filter(n => selected.value.has(n.id)).map(n => n.id))

// ── Группы по дням ──
const dayFmt = new Intl.DateTimeFormat('ru', {day: 'numeric', month: 'long'})
const timeFmt = new Intl.DateTimeFormat('ru', {hour: '2-digit', minute: '2-digit'})

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Сегодня'
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
  return dayFmt.format(d)
}

const groups = computed(() => {
  const out: { label: string; items: NotificationItem[] }[] = []
  for (const n of visible.value) {
    const label = dayLabel(n.showAt)
    const last = out[out.length - 1]
    if (last?.label === label) last.items.push(n)
    else out.push({label, items: [n]})
  }
  return out
})

const typeItems = [
  {label: 'Все виды', value: 'all'},
  ...Object.entries(NOTIFICATION_TYPES).map(([value, t]) => ({label: t.label, value})),
]

const ICON = 'size-8 shrink-0 rounded-xs flex items-center justify-center ring ring-accented text-muted bg-white hover:ring-inverted/60 hover:text-toned transition-colors'
</script>

<template>
  <Page>
    <template #header>
      <Header>Уведомления</Header>
    </template>

    <template #toolbar>
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex gap-1.5">
          <button
              type="button"
              class="plan-scope w-[110px]"
              :class="filter === 'all' && 'nav-tab-active'"
              @click="filter = 'all'"
          >
            Все · {{ total }}
          </button>
          <button
              type="button"
              class="plan-scope w-[150px]"
              :class="filter === 'unread' && 'nav-tab-active'"
              @click="filter = 'unread'"
          >
            Непрочитанные · {{ unread }}
          </button>
        </div>
        <USelect v-model="type" :items="typeItems" class="w-40"/>
        <div class="ms-auto flex items-center gap-2">
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" title="Обновить" @click="load()"/>
          <UInput v-model="search" icon="i-lucide-search" placeholder="Поиск" class="w-64"/>
        </div>
      </div>
    </template>

    <!-- Список на всю ширину; «Выбрать все» — над ним, на одной линии с отметками строк -->
    <div class="space-y-2">
      <label v-if="visible.length" class="flex items-center gap-2 px-3 text-sm text-toned w-fit cursor-pointer">
        <UCheckbox :model-value="allSelected" @update:model-value="toggleAll"/>
        Выбрать все
      </label>

      <p v-if="!visible.length && !loading" class="text-sm text-dimmed px-3 py-6">
        {{ filter === 'unread' ? 'Непрочитанных уведомлений нет.' : 'Уведомлений нет.' }}
      </p>

      <div v-for="g in groups" :key="g.label" class="space-y-1.5">
        <USeparator :label="g.label" :ui="{ label: 'text-xs text-dimmed' }" class="pt-3 pb-1"/>

        <div
            v-for="n in g.items"
            :key="n.id"
            class="rounded-sm ring ring-inset bg-white/70 transition-shadow"
            :class="openId === n.id ? 'ring-2 ring-inverted' : 'ring-default hover:ring-inverted/60'"
        >
          <!-- Строка -->
          <div class="flex items-center gap-3 px-3 h-12 cursor-pointer" @click="openMessage(n)">
            <span class="flex" @click.stop>
              <UCheckbox :model-value="selected.has(n.id)" @update:model-value="toggle(n.id)"/>
            </span>
            <span class="size-2 shrink-0 rounded-full" :class="n.readAt ? 'bg-transparent' : 'bg-warning'"/>
            <UIcon :name="notificationType(n.type).icon" class="size-4 shrink-0 text-dimmed"/>
            <span class="flex-1 min-w-0 truncate" :class="n.readAt ? 'text-toned' : 'text-highlighted font-medium'">
              {{ n.title }}
            </span>
            <span class="text-xs text-dimmed tabular-nums shrink-0">{{ timeFmt.format(new Date(n.showAt)) }}</span>
            <UIcon
                :name="openId === n.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-4 shrink-0 text-dimmed"
            />
          </div>

          <!-- Сообщение -->
          <div v-if="openId === n.id" class="border-t border-default px-3 py-3 ps-[4.25rem] space-y-3">
            <p class="text-xs text-dimmed">
              {{ notificationType(n.type).label }} · {{ dayLabel(n.showAt) }}, {{ timeFmt.format(new Date(n.showAt)) }}
            </p>
            <p v-if="n.body" class="text-sm text-default whitespace-pre-line">{{ n.body }}</p>

            <div class="flex flex-wrap items-center gap-2">
              <UButton
                  v-if="n.link"
                  :label="notificationType(n.type).action"
                  icon="i-lucide-arrow-right"
                  size="sm"
                  @click="follow(n)"
              />
              <UTooltip text="Отложить на 10 минут">
                <button type="button" :class="ICON" aria-label="Отложить" @click="snooze(n)">
                  <UIcon name="i-lucide-alarm-clock" class="size-4"/>
                </button>
              </UTooltip>
              <UTooltip :text="n.readAt ? 'Отметить непрочитанным' : 'Отметить прочитанным'">
                <button
                    type="button"
                    :class="ICON"
                    :aria-label="n.readAt ? 'Отметить непрочитанным' : 'Отметить прочитанным'"
                    @click="setRead([n.id], !n.readAt)"
                >
                  <UIcon :name="n.readAt ? 'i-lucide-mail' : 'i-lucide-mail-open'" class="size-4"/>
                </button>
              </UTooltip>
              <UTooltip text="Удалить">
                <button type="button" :class="ICON" aria-label="Удалить" @click="remove([n.id])">
                  <UIcon name="i-lucide-trash-2" class="size-4"/>
                </button>
              </UTooltip>
            </div>
          </div>
        </div>
      </div>

      <div v-if="nextCursor" class="flex justify-center pt-2">
        <UButton label="Показать ещё" size="sm" :loading="loading" @click="load(true)"/>
      </div>

      <!-- Действия с выбранными -->
      <div
          v-if="selectedIds.length"
          class="sticky bottom-0 z-10 flex items-center gap-2 rounded-sm ring-2 ring-inset ring-inverted bg-white py-1.5 px-2 ps-3"
      >
        <span class="flex-1 text-sm text-toned">Выбрано: {{ selectedIds.length }}</span>
        <UButton label="Прочитано" icon="i-lucide-mail-open" size="sm" class="w-[130px] justify-center"
                 @click="setRead(selectedIds, true); selected = new Set()"/>
        <UButton label="Непрочитано" icon="i-lucide-mail" size="sm" class="w-[130px] justify-center"
                 @click="setRead(selectedIds, false); selected = new Set()"/>
        <UButton label="Удалить" icon="i-lucide-trash-2" size="sm" class="w-[130px] justify-center"
                 @click="remove(selectedIds)"/>
        <UButton icon="i-lucide-x" size="sm" color="neutral" variant="ghost" aria-label="Снять выделение"
                 @click="selected = new Set()"/>
      </div>
    </div>
  </Page>
</template>
