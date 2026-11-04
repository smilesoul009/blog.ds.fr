<script setup lang="ts">
import type {ClientListItem} from '~~/shared/types/clientList'
import {userFullName} from '~~/shared/types/userList'

defineProps<{ client: ClientListItem; to: string }>()
</script>

<template>
  <ListRow :to="to" class="p-2.5!" :class="client.deletionRequestedAt && 'opacity-60'">
    <div class="flex items-center gap-4">
      <img
          :src="avatarFor(client)"
          :alt="userFullName(client)"
          loading="lazy"
          class="size-14 rounded-full object-cover shrink-0"
      >
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-medium">{{ userFullName(client) }}</span>
          <UBadge v-if="client.isMine" label="Мой клиент" color="neutral" variant="subtle" size="sm"/>
          <UBadge v-if="client.deletionRequestedAt" label="Будет удалён" color="neutral" variant="outline" size="sm"/>
        </div>
        <p class="text-sm text-muted mt-1 truncate">{{ client.email }}</p>
        <p v-if="client.myComment" class="text-sm text-toned mt-2 border-l-2 border-default pl-3 line-clamp-2">
          {{ client.myComment }}
        </p>
      </div>
      <span class="text-xs text-dimmed shrink-0 text-right">
        статей {{ client._count.clientLibrary }}<br>прочитано {{ client.readCount }}
      </span>
    </div>
  </ListRow>
</template>