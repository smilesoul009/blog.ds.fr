<script setup lang="ts">
// Название, которое правится прямо в строке списка: клик по названию (курсор — по месту клика) начинает правку
// (задачи, этапы — StatusList; цели — список целей).
// Enter или клик мимо — сохранить (событие save), Esc — отменить, Tab / Shift+Tab — сохранить и событие tab (±1).
// Пустое и неизменённое не сохраняется. Новое название видно сразу, до ответа сервера.
const props = withDefaults(defineProps<{
  title: string
  maxlength?: number
}>(), {
  maxlength: 300,
})

const emit = defineEmits<{
  save: [title: string]
  tab: [delta: number]
  done: []           // правка закончена по Enter или Esc — вернуть фокус строке
}>()

const editing = ref(false)
const value = ref('')
const input = ref<HTMLInputElement | null>(null)

// Сохранённое, но ещё не пришедшее из данных название; сбрасывается, когда меняется title
const pending = ref<string | null>(null)
watch(() => props.title, () => (pending.value = null))
const shown = computed(() => pending.value ?? props.title)

// Позиция курсора в тексте по месту клика (если браузер умеет); иначе — в конец
function caretFromClick(ev?: MouseEvent): number | null {
  if (!ev) return null
  const doc = document as any
  if (doc.caretPositionFromPoint) return doc.caretPositionFromPoint(ev.clientX, ev.clientY)?.offset ?? null
  if (doc.caretRangeFromPoint) return doc.caretRangeFromPoint(ev.clientX, ev.clientY)?.startOffset ?? null
  return null
}

function start(ev?: MouseEvent) {
  if (editing.value) return
  const caret = caretFromClick(ev)
  value.value = shown.value
  editing.value = true
  nextTick(() => {
    const el = input.value
    if (!el) return
    el.focus()
    const pos = caret == null ? el.value.length : Math.min(caret, el.value.length)
    el.setSelectionRange(pos, pos)
  })
}

function commit() {
  if (!editing.value) return
  editing.value = false
  const title = value.value.trim()
  if (!title || title === shown.value) return
  pending.value = title
  emit('save', title)
}

function cancel() {
  editing.value = false
  emit('done')
}

function onEnter() {
  commit()
  emit('done')
}

function onTab(delta: number) {
  commit()
  emit('tab', delta)
}

defineExpose({start, commit, editing})
</script>

<template>
  <div class="flex-1 min-w-0 flex items-center">
    <input
        v-if="editing"
        ref="input"
        v-model="value"
        :maxlength="maxlength"
        class="flex-1 min-w-0 h-8 -my-1 px-1.5 rounded-xs bg-white text-default ring-2 ring-inverted outline-none"
        aria-label="Название"
        @click.stop
        @blur="commit"
        @keydown.enter.stop.prevent="onEnter"
        @keydown.esc.stop.prevent="cancel"
        @keydown.tab.exact.prevent="onTab(1)"
        @keydown.shift.tab.prevent="onTab(-1)"
    >

    <!-- Клик по названию — правка -->
    <span
        v-else
        class="flex-1 min-w-0 flex items-center gap-1.5 h-8 -my-1 px-1.5 rounded-xs cursor-text hover:bg-elevated/60"
        :title="shown"
        @click.stop="start($event)"
    >
      <span class="min-w-0 truncate">{{ shown }}</span>
      <UIcon name="i-lucide-pencil" class="size-3.5 shrink-0 text-dimmed opacity-0 group-hover:opacity-100"/>
    </span>
  </div>
</template>
