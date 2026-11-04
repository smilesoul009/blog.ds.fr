<script setup lang="ts">
// Колокольчик: уведомления сайта. Опрос раз в минуту, новые показываются всплывающим сообщением
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

// Страница «Уведомления» увеличивает счётчик, когда что-то меняет, — колокольчик перечитывает список
const tick = useState('notifications-tick', () => 0)
watch(tick, () => load())

const items = ref<NotificationItem[]>([])
const unread = ref(0)
const open = ref(false)

// Что уже видели: id → showAt (отложенное уведомление возвращается с новым showAt)
let seen: Map<string, string> | null = null

async function load() {
  try {
    const res = await api<{ items: NotificationItem[]; unread: number }>('/api/notifications')
    const fresh = seen ? res.items.filter(n => !n.readAt && seen!.get(n.id) !== n.showAt) : []
    seen = new Map(res.items.map(n => [n.id, n.showAt]))
    items.value = res.items
    unread.value = res.unread
    for (const n of fresh.slice(0, 3)) notify(n)
  } catch {
    // Нет сети или сессия закончилась — попробуем в следующий раз
  }
}

function notify(n: NotificationItem) {
  toast.add({
    title: n.title,
    description: n.body ?? undefined,
    icon: 'i-lucide-bell',
    color: 'warning',
    duration: 15000,
    actions: [
      {label: 'Открыть', color: 'neutral', variant: 'outline', onClick: () => openItem(n)},
      {label: 'Отложить', color: 'neutral', variant: 'ghost', onClick: () => snooze(n)},
    ],
  })
}

async function markRead(n: NotificationItem) {
  if (n.readAt) return
  n.readAt = new Date().toISOString()
  unread.value = Math.max(0, unread.value - 1)
  try {
    await api(`/api/notifications/${n.id}/read`, {method: 'POST'})
  } catch {
    // не страшно: при следующем опросе состояние обновится
  }
}

// Всплывающее сообщение «Открыть» — сразу по ссылке
async function openItem(n: NotificationItem) {
  open.value = false
  await markRead(n)
  if (n.link) await navigateTo(n.link)
}

// Клик в списке колокольчика — открыть сообщение на странице «Уведомления»
async function showItem(n: NotificationItem) {
  open.value = false
  await navigateTo({path: '/notifications', query: {open: n.id}})
}

async function snooze(n: NotificationItem) {
  try {
    await api(`/api/notifications/${n.id}/snooze`, {method: 'POST'})
    toast.add({title: 'Напомню через 10 минут', color: 'neutral', duration: 3000})
    await load()
  } catch (e: any) {
    toast.add({title: 'Не удалось отложить', description: e?.data?.message, color: 'error'})
  }
}

async function readAll() {
  try {
    await api('/api/notifications/read-all', {method: 'POST'})
    await load()
  } catch (e: any) {
    toast.add({title: 'Не удалось', description: e?.data?.message, color: 'error'})
  }
}

const rtf = new Intl.RelativeTimeFormat('ru', {numeric: 'auto'})

function ago(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return rtf.format(-min, 'minute')
  const h = Math.round(min / 60)
  if (h < 24) return rtf.format(-h, 'hour')
  return new Date(iso).toLocaleString('ru', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})
}

onMounted(() => {
  // Часовой пояс браузера — для напоминаний по вашим часам
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (timezone) api('/api/notifications/timezone', {method: 'POST', body: {timezone}}).catch(() => {})
  load()
})

useIntervalFn(load, 60_000)
useEventListener(import.meta.client ? window : undefined, 'focus', load)
watch(open, v => v && load())
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'end' }">
    <button type="button" class="nav-tab-right relative" aria-label="Уведомления" title="Уведомления">
      <UIcon name="i-lucide-bell" class="size-5"/>
      <span
          v-if="unread"
          class="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-sub-550 text-white text-[10px]
                 font-medium flex items-center justify-center"
      >
        {{ unread > 99 ? '99+' : unread }}
      </span>
    </button>

    <template #content>
      <div class="w-96 max-h-[70vh] flex flex-col">
        <div class="flex items-center justify-between gap-2 px-3 py-2 border-b border-default">
          <span class="font-medium text-sm">Уведомления</span>
          <UButton
              v-if="unread"
              label="Прочитать все"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="readAll"
          />
        </div>

        <p v-if="!items.length" class="px-3 py-6 text-sm text-dimmed text-center">Уведомлений пока нет.</p>

        <div v-else class="overflow-y-auto divide-y divide-default">
          <div
              v-for="n in items"
              :key="n.id"
              role="button"
              tabindex="0"
              class="flex gap-2 px-3 py-2.5 cursor-pointer hover:bg-elevated/60 focus:outline-none focus-visible:bg-elevated"
              @click="showItem(n)"
              @keydown.enter.prevent="showItem(n)"
          >
            <span
                class="mt-1.5 size-2 shrink-0 rounded-full"
                :class="n.readAt ? 'bg-transparent' : 'bg-warning'"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm" :class="n.readAt ? 'text-toned' : 'text-highlighted font-medium'">{{ n.title }}</p>
              <p v-if="n.body" class="text-xs text-dimmed line-clamp-2 whitespace-pre-line">{{ n.body }}</p>
              <p class="text-[11px] text-dimmed mt-0.5">{{ ago(n.showAt) }}</p>
            </div>
            <UButton
                v-if="!n.readAt"
                icon="i-lucide-alarm-clock"
                size="xs"
                color="neutral"
                variant="ghost"
                title="Отложить на 10 минут"
                aria-label="Отложить"
                @click.stop="snooze(n)"
            />
          </div>
        </div>

        <NuxtLink
            to="/notifications"
            class="block px-3 py-2 border-t border-default text-sm text-center text-toned hover:text-highlighted hover:bg-elevated/60"
            @click="open = false"
        >
          Все уведомления
        </NuxtLink>
      </div>
    </template>
  </UPopover>
</template>
