<script setup lang="ts">
import {type ClientAccountItem, deletionDate} from '~~/shared/types/clientAccount'
import {userFullName} from '~~/shared/types/userList'

defineProps<{ client: ClientAccountItem; to: string }>()
</script>

<template>
  <ListRow :to="to" class="p-2.5!" :class="(!client.isActive || client.deletionRequestedAt) && 'opacity-60'">
    <div class="flex items-center gap-4">
      <img
          :src="avatarFor(client)"
          :alt="userFullName(client)"
          loading="lazy"
          class="size-14 rounded-full object-cover shrink-0"
      >
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-medium">{{ userFullName(client) }}</span>
          <UBadge v-if="!client.isActive" label="Заблокирован" color="neutral" variant="subtle" size="sm"/>
          <UBadge
              v-if="client.deletionRequestedAt"
              :label="`Удаление ${deletionDate(client)}`"
              color="neutral"
              variant="outline"
              size="sm"
          />
        </div>

        <p class="text-sm text-muted mt-1 truncate">{{ client.username }} · {{ client.email }}</p>

        <p class="text-xs text-dimmed mt-1">
          Зарегистрирован {{ new Date(client.createdAt).toLocaleDateString('ru') }} ·
          статей: {{ client._count.clientLibrary }} ·
          отметок авторов: {{ client._count.clientMarks }}
        </p>
      </div>
    </div>
  </ListRow>
</template>