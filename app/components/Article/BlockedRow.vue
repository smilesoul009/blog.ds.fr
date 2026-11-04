<script setup lang="ts">
import {blockPersonName} from '~~/shared/types/articleBlock'
import {type BlockedItem, formatDateTime} from '~~/shared/types/blockedList'

const props = defineProps<{ item: BlockedItem; to: string; loading?: boolean }>()
const emit = defineEmits<{ unblock: [] }>()

const authorNames = computed(() => props.item.authors.map(a => blockPersonName(a.user)).join(', '))
</script>

<template>
  <ListRow :to="to" class="p-2.5!">
    <div class="flex items-start gap-4">
      <div class="relative shrink-0 w-20 h-14 overflow-hidden rounded-xs bg-sub-200">
        <img
            v-if="item.coverUrl"
            :src="item.coverUrl"
            :alt="item.title"
            loading="lazy"
            class="absolute inset-0 w-full h-full object-cover"
        >
        <ReaderCoverPlaceholder v-else size="h-4/5"/>
      </div>

      <div class="min-w-0 flex-1 space-y-1.5">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-medium">{{ item.title }}</p>
          <UBadge
              v-if="item.blockReply"
              label="Есть ответ"
              icon="i-lucide-message-square-reply"
              color="neutral"
              variant="subtle"
              size="sm"
          />
        </div>

        <p class="text-xs text-dimmed">{{ item.area.name }} · {{ authorNames }}</p>

        <p class="text-sm text-default whitespace-pre-line">
          <span class="text-dimmed">
            Причина ({{ blockPersonName(item.blockedBy) || 'Администратор' }}, {{ formatDateTime(item.blockedAt) }}):
          </span>
          {{ item.blockReason }}
        </p>

        <p v-if="item.blockReply" class="text-sm text-default whitespace-pre-line border-l-2 border-default pl-3">
          <span class="text-dimmed">
            Ответ ({{ blockPersonName(item.blockReplyBy) }}, {{ formatDateTime(item.blockReplyAt) }}):
          </span>
          {{ item.blockReply }}
        </p>
        <p v-else class="text-xs text-dimmed">Автор ещё не ответил</p>
      </div>

      <UButton
          icon="i-lucide-lock-open"
          label="Разблокировать"
          class="shrink-0 w-[160px] justify-center"
          :loading="loading"
          @click.prevent.stop="emit('unblock')"
      />
    </div>
  </ListRow>
</template>