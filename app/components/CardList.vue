<script setup lang="ts" generic="T extends { id: string }">
const props = withDefaults(defineProps<{
  items: T[]
  view: 'cards' | 'list'
  pending?: boolean
  emptyText?: string
  kind?: 'articles' | 'people'
}>(), {
  pending: false,
  emptyText: 'Ничего не найдено',
  kind: 'articles',
})

const GRID = {
  articles: 'sm:grid-cols-2 lg:grid-cols-3',
  people: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
} as const

defineSlots<{
  card(props: { item: T }): any
  row(props: { item: T }): any
}>()
</script>

<template>
  <p v-if="pending" class="text-muted">Загрузка...</p>

  <p v-else-if="!items.length" class="text-muted">{{ emptyText }}</p>

  <div v-else-if="view === 'cards'" class="grid gap-3" :class="GRID[kind]">
    <template v-for="item in items" :key="item.id">
      <slot name="card" :item="item"/>
    </template>
  </div>

  <div v-else class="space-y-2">
    <template v-for="item in items" :key="item.id">
      <slot name="row" :item="item"/>
    </template>
  </div>
</template>