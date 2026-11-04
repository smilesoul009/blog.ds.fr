<script setup lang="ts">
const props = defineProps<{
  comment: string
  author?: { firstName: string | null; lastName: string | null } | null
  date?: string | null
}>()

const caption = computed(() => {
  const name = [props.author?.firstName, props.author?.lastName].filter(Boolean).join(' ')
  const date = props.date ? new Date(props.date).toLocaleDateString('ru') : ''
  return [name, date].filter(Boolean).join(' · ')
})
</script>

<template>
  <!-- Обёртка гасит клик, чтобы карточка-ссылка не открывала статью -->
  <span class="inline-flex" @click.prevent.stop>
    <UPopover :content="{ side: 'bottom', align: 'end' }">
      <UButton
          icon="i-lucide-message-square-text"
          aria-label="Комментарий автора"
          size="sm"
      />

      <template #content>
        <div class="max-w-72 p-3 space-y-1.5">
          <p class="text-sm text-default whitespace-pre-line">{{ comment }}</p>
          <p v-if="caption" class="text-xs text-dimmed">{{ caption }}</p>
        </div>
      </template>
    </UPopover>
  </span>
</template>