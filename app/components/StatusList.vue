<script setup lang="ts" generic="T extends { id: string; title: string; status: PlanStatus }">
import type {Ref} from 'vue'
import {useSortable} from '@vueuse/integrations/useSortable'
import type {PlanStatus} from '~~/shared/types/plan'
import {STATUS_LABEL, STATUS_ORDER} from '~~/shared/utils/planTasks'

// Стандартный список со статусами (задачи плана, этапы цели):
// быстрое добавление сверху, области «Не выполнено / Частично / Выполнено», перетаскивание (в т.ч. между областями —
// меняет статус), сквозной номер, ✓ ½, меню ⋮ (слот #menu). Название правится прямо в строке:
// клик по названию (или Enter / F2 на выбранной строке) → поле поверх названия (InlineTitle); Enter / клик мимо — сохранить,
// Esc — отменить, Tab / Shift+Tab — сохранить и править следующее / предыдущее. Пустое название не сохраняется.
// Список не знает, что внутри: сохраняет страница (события add, rename, status, reorder)
const props = withDefaults(defineProps<{
  items: T[]
  addPlaceholder?: string
  emptyText?: string
  pending?: boolean
  collapseKey: string            // кука «Выполнено свёрнуто» — своя у каждого списка
}>(), {
  addPlaceholder: 'Новая запись — Enter, чтобы добавить',
  emptyText: 'Пока пусто.',
  pending: false,
})

const emit = defineEmits<{
  add: [title: string]
  rename: [item: T, title: string]
  status: [item: T, status: PlanStatus]
  reorder: [ids: string[], moved?: { id: string; status: PlanStatus }, focusId?: string]
}>()

defineSlots<{
  menu?: (props: { item: T }) => any     // меню ⋮ строки
  tools?: () => any                      // справа от поля добавления (например, «Удалённые»)
}>()

type Entry =
    | { kind: 'divider'; key: string; status: PlanStatus }
    | { kind: 'item'; key: string; item: T }

const collapsed = useCookie<boolean>(props.collapseKey, {default: () => false, maxAge: 60 * 60 * 24 * 365, sameSite: 'lax'})


const counts = computed(() => {
  const c: Record<PlanStatus, number> = {TODO: 0, PARTIAL: 0, DONE: 0}
  for (const t of props.items) c[t.status]++
  return c
})

function build(): Entry[] {
  const out: Entry[] = []
  for (const status of STATUS_ORDER) {
    out.push({kind: 'divider', key: `divider-${status}`, status})
    if (status === 'DONE' && collapsed.value) continue
    for (const item of props.items.filter(t => t.status === status)) out.push({kind: 'item', key: item.id, item})
  }
  return out
}

const entries = ref<Entry[]>(build()) as Ref<Entry[]>
watch([() => props.items, collapsed], () => (entries.value = build()))

const visible = computed(() => entries.value.flatMap(e => (e.kind === 'item' ? [e.item] : [])))
const numberOf = computed(() => new Map(visible.value.map((t, i) => [t.id, i + 1])))

// Полный порядок для сервера: видимые + свёрнутые (по областям)
function withHidden(ids: string[]): string[] {
  const rest = STATUS_ORDER.flatMap(s => props.items.filter(t => t.status === s && !ids.includes(t.id)))
  return [...ids, ...rest.map(t => t.id)]
}

// ── Перетаскивание (за ⋮⋮) ──
const listEl = ref<HTMLElement | null>(null)
useSortable(listEl, entries, {
  handle: '.drag-handle',
  animation: 150,
  forceFallback: true,
  fallbackTolerance: 3,
  ghostClass: 'opacity-40',
  chosenClass: 'shadow-md',
  onMove: (evt: any) => !(evt.related?.dataset?.first === '1' && !evt.willInsertAfter),
  onEnd: (e: any) => {
    if (e.oldIndex === e.newIndex) return
    const id = (e.item as HTMLElement).dataset.id
    nextTick(() => {
      let status: PlanStatus = 'TODO'
      let moved: { id: string; status: PlanStatus } | undefined
      for (const entry of entries.value) {
        if (entry.kind === 'divider') status = entry.status
        else if (entry.item.id === id && entry.item.status !== status) moved = {id, status}
      }
      emit('reorder', withHidden(visible.value.map(t => t.id)), moved)
    })
  },
})

function moveBy(item: T, delta: number) {
  const list = visible.value
  const i = list.findIndex(t => t.id === item.id)
  const j = i + delta
  if (i < 0 || j < 0 || j >= list.length || list[j]!.status !== item.status) return
  const ids = list.map(t => t.id)
  ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  emit('reorder', withHidden(ids), undefined, item.id)
}

// ── Правка названия в строке — InlineTitle (режим text) ──
type TitleRef = { start: (ev?: MouseEvent) => void }
const titles = new Map<string, TitleRef>()

function setTitle(id: string, el: unknown) {
  if (el) titles.set(id, el as TitleRef)
  else titles.delete(id)
}

function startEdit(id: string) {
  titles.get(id)?.start()
}

// Tab / Shift+Tab — править следующее / предыдущее название
function editNext(id: string, delta: number) {
  const list = visible.value
  const next = list[list.findIndex(t => t.id === id) + delta]
  if (next) startEdit(next.id)
}

// ── Фокус и клавиатура ──
const rowEls = new Map<string, HTMLElement>()

function setRow(id: string, el: unknown) {
  if (el) rowEls.set(id, el as HTMLElement)
  else rowEls.delete(id)
}

const addInput = ref<any>(null)
const draft = ref('')

function focusAdd() {
  addInput.value?.inputRef?.focus()
}

function focusItem(id: string) {
  rowEls.get(id)?.focus()
}

function focusNext(id: string, delta: number) {
  const list = visible.value
  const j = list.findIndex(t => t.id === id) + delta
  if (j < 0) return focusAdd()
  const next = list[j]
  if (next) focusItem(next.id)
}

function submitDraft() {
  const title = draft.value.trim()
  if (!title) return
  emit('add', title)
  draft.value = ''
}

function cancelDraft(e: KeyboardEvent) {
  draft.value = ''
  ;(e.target as HTMLInputElement).blur()
}

defineExpose({focusAdd, focusItem})

const ROW = `group flex items-center gap-3 rounded-sm ring ring-inset ring-default ps-1 pe-2 h-12
  transition-shadow focus:outline-none hover:ring-2 hover:ring-inverted/60 focus-visible:ring-2 focus-visible:ring-inverted`
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <UInput
          ref="addInput"
          v-model="draft"
          icon="i-lucide-plus"
          :placeholder="addPlaceholder"
          class="flex-1"
          :ui="{ base: 'h-9' }"
          @keydown.enter.prevent="submitDraft"
          @keydown.esc.stop.prevent="cancelDraft"
          @keydown.down.prevent="visible[0] && focusItem(visible[0].id)"
      />
      <slot name="tools"/>
    </div>

    <p v-if="pending && !items.length" class="text-muted text-sm">Загрузка...</p>
    <p v-else-if="!items.length" class="text-muted text-sm px-1">{{ emptyText }}</p>

    <!-- Пустой список — только сообщение; разделители областей есть всегда, чтобы перетаскивание работало -->
    <div v-show="items.length" ref="listEl" class="space-y-1.5">
      <div
          v-for="entry in entries"
          :key="entry.key"
          :data-id="entry.kind === 'item' ? entry.item.id : undefined"
          :data-first="entry.kind === 'divider' && entry.status === 'TODO' ? '1' : undefined"
      >
        <div v-if="entry.kind === 'divider'" class="pt-3 pb-1 select-none" :class="entry.status === 'TODO' && 'pt-1'">
          <USeparator v-if="entry.status !== 'DONE'" :ui="{ label: 'text-xs text-dimmed' }"
                      :label="`${STATUS_LABEL[entry.status]} · ${counts[entry.status]}`"/>
          <USeparator v-else>
            <button
                type="button"
                class="flex items-center gap-1 text-xs text-dimmed hover:text-toned"
                @click="collapsed = !collapsed"
            >
              {{ STATUS_LABEL.DONE }} · {{ counts.DONE }}
              <UIcon :name="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'" class="size-3.5"/>
            </button>
          </USeparator>
        </div>

        <div
            v-else
            :ref="el => setRow(entry.item.id, el)"
            tabindex="0"
            :class="[ROW, entry.item.status === 'TODO' ? 'bg-white/70 text-default' : 'bg-white/40 text-dimmed']"
            @keydown.enter.self.prevent="startEdit(entry.item.id)"
            @keydown.f2.self.prevent="startEdit(entry.item.id)"
            @keydown.down.exact.self.prevent="focusNext(entry.item.id, 1)"
            @keydown.up.exact.self.prevent="focusNext(entry.item.id, -1)"
            @keydown.alt.down.self.prevent="moveBy(entry.item, 1)"
            @keydown.alt.up.self.prevent="moveBy(entry.item, -1)"
        >
          <span
              class="drag-handle shrink-0 flex items-center h-full px-1 cursor-grab active:cursor-grabbing text-dimmed hover:text-toned"
              title="Перетащить"
          >
            <UIcon name="i-lucide-grip-vertical" class="size-4"/>
          </span>

          <span class="w-3 text-right tabular-nums shrink-0">{{ numberOf.get(entry.item.id) }}</span>
          <USeparator orientation="vertical" class="h-6"/>

          <!-- Название: клик — правка прямо в строке -->
          <InlineTitle
              :ref="el => setTitle(entry.item.id, el)"
              :title="entry.item.title"
              @save="t => emit('rename', entry.item, t)"
              @tab="d => editNext(entry.item.id, d)"
              @done="focusItem(entry.item.id)"
          />

          <PlanStatusIcons :status="entry.item.status" @set="s => emit('status', entry.item, s)"/>
          <slot name="menu" :item="entry.item"/>
        </div>
      </div>
    </div>
  </div>
</template>
