<script setup lang="ts">
import {blockPersonName} from '~~/shared/types/articleBlock'
import {type BlockedItem, formatDateTime} from '~~/shared/types/blockedList'

const props = defineProps<{ item: BlockedItem; to: string; loading?: boolean }>()
const emit = defineEmits<{ unblock: [] }>()

const authors = computed(() => props.item.authors.map(a => ({
  id: a.user.id,
  name: blockPersonName(a.user) || 'Автор',
  avatarUrl: null,
})))
</script>

<template>
  <NuxtLink
      :to="to"
      class="flex flex-col page-card overflow-hidden hover:bg-white/85 transition duration-200"
  >
    <div class="relative shrink-0 aspect-[16/9] overflow-hidden bg-sub-200">
      <img
          v-if="item.coverUrl"
          :src="item.coverUrl"
          :alt="item.title"
          loading="lazy"
          class="absolute inset-0 w-full h-full object-cover"
      >
      <ReaderCoverPlaceholder v-else/>

      <div class="absolute top-2 left-2 flex flex-wrap gap-1.5">
        <UBadge label="Заблокирована" icon="i-lucide-lock" color="error" variant="subtle" size="sm" class="bg-white"/>
        <UBadge
            v-if="item.blockReply"
            label="Есть ответ"
            icon="i-lucide-message-square-reply"
            color="neutral"
            variant="subtle"
            size="sm"
            class="bg-white"
        />
      </div>
    </div>

    <div class="flex-1 flex flex-col gap-1.5 p-3">
      <div class="flex items-center gap-2 text-xs">
        <span class="text-toned ring ring-inset ring-default rounded-xs px-1.5 py-0.5 truncate">
          {{ item.area.name }}
        </span>
        <span class="text-dimmed shrink-0">{{ formatDateTime(item.blockedAt) }}</span>
      </div>

      <h3 class="font-medium text-highlighted leading-snug">{{ item.title }}</h3>

      <p class="text-sm line-clamp-3">
        <span class="text-dimmed">Причина: </span>{{ item.blockReason }}
      </p>

      <p v-if="item.blockReply" class="text-sm line-clamp-3 border-l-2 border-default pl-2">
        <span class="text-dimmed">Ответ: </span>{{ item.blockReply }}
      </p>
      <p v-else class="text-xs text-dimmed">Автор ещё не ответил</p>

      <div class="mt-auto pt-2 flex items-center justify-between gap-2">
        <ReaderAuthors :authors="authors"/>
        <UButton
            icon="i-lucide-lock-open"
            label="Разблокировать"
            size="sm"
            class="shrink-0"
            :loading="loading"
            @click.prevent.stop="emit('unblock')"
        />
      </div>
    </div>
  </NuxtLink>
</template>