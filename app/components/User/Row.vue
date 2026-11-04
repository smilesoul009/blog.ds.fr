<script setup lang="ts">
import {ROLE_LABELS} from '~~/shared/constants/enums'
import {type UserListItem, userFullName} from '~~/shared/types/userList'

defineProps<{ user: UserListItem; to: string }>()
</script>

<template>
  <ListRow :to="to" class="p-2.5!" :class="!user.isActive && 'opacity-60'">
    <div class="flex items-center gap-4 min-w-0">
      <img
          :src="avatarFor(user)"
          :alt="userFullName(user)"
          loading="lazy"
          class="size-14 rounded-full object-cover shrink-0"
      >
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-medium">{{ userFullName(user) }}</p>
          <UBadge
              v-if="!user.isActive"
              label="Отключён"
              color="neutral"
              variant="subtle"
              size="sm"
          />
        </div>
        <p class="text-sm text-highlighted mt-1 truncate">{{ user.username }} · {{ user.email }}</p>
        <div class="flex flex-wrap gap-1 mt-2">
          <UBadge
              v-for="role in user.roles"
              :key="role"
              :label="ROLE_LABELS[role]"
              color="neutral"
              variant="outline"
              size="sm"
          />
        </div>
      </div>
    </div>
  </ListRow>
</template>