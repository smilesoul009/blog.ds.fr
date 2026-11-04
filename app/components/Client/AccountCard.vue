<script setup lang="ts">
import {type ClientAccountItem, deletionDate} from '~~/shared/types/clientAccount'
import {userFullName} from '~~/shared/types/userList'

defineProps<{ client: ClientAccountItem; to: string }>()
</script>

<template>
  <NuxtLink
      :to="to"
      class="flex flex-col items-center text-center gap-2 page-card p-4 hover:bg-white/85 transition duration-200"
      :class="(!client.isActive || client.deletionRequestedAt) && 'opacity-60'"
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
      с {{ new Date(client.createdAt).toLocaleDateString('ru') }} ·
      статей {{ client._count.clientLibrary }} ·
      отметок {{ client._count.clientMarks }}
    </p>

    <div class="flex flex-wrap justify-center gap-1 mt-auto">
      <UBadge v-if="!client.isActive" label="Заблокирован" color="neutral" variant="subtle" size="sm"/>
      <UBadge
          v-if="client.deletionRequestedAt"
          :label="`Удаление ${deletionDate(client)}`"
          color="neutral"
          variant="outline"
          size="sm"
      />
    </div>
  </NuxtLink>
</template>