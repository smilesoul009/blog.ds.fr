<script setup lang="ts">
import type {ClientListItem} from '~~/shared/types/clientList'
import {userFullName} from '~~/shared/types/userList'

defineProps<{ client: ClientListItem; to: string }>()
</script>

<template>
  <NuxtLink
      :to="to"
      class="flex flex-col items-center text-center gap-2 page-card p-4 hover:bg-white/85 transition duration-200"
      :class="client.deletionRequestedAt && 'opacity-60'"
  >
    <img
        :src="avatarFor(client)"
        :alt="userFullName(client)"
        loading="lazy"
        class="size-24 rounded-full object-cover"
    >

    <div class="min-w-0 w-full">
      <p class="font-medium text-highlighted truncate">{{ userFullName(client) }}</p>
      <p class="text-xs text-muted truncate mt-0.5">{{ client.email }}</p>
    </div>

    <p class="text-xs text-toned">
      статей {{ client._count.clientLibrary }} · прочитано {{ client.readCount }}
    </p>

    <p v-if="client.myComment" class="text-xs text-toned line-clamp-2 border-l-2 border-default pl-2 text-left w-full">
      {{ client.myComment }}
    </p>

    <div class="flex flex-wrap justify-center gap-1 mt-auto">
      <UBadge v-if="client.isMine" label="Мой клиент" color="neutral" variant="subtle" size="sm"/>
      <UBadge v-if="client.deletionRequestedAt" label="Будет удалён" color="neutral" variant="outline" size="sm"/>
    </div>
  </NuxtLink>
</template>