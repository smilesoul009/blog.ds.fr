<script setup lang="ts">
import {ROLE_LABELS} from '~~/shared/constants/enums'
import {type UserListItem, userFullName} from '~~/shared/types/userList'

defineProps<{ user: UserListItem; to: string }>()
</script>

<template>
  <NuxtLink
      :to="to"
      class="flex flex-col items-center text-center gap-2 page-card p-4 hover:bg-white/85 transition duration-200"
      :class="!user.isActive && 'opacity-60'"
  >
    <img
        :src="avatarFor(user)"
        :alt="userFullName(user)"
        loading="lazy"
        class="size-24 rounded-full object-cover"
    >

    <div class="min-w-0 w-full">
      <p class="font-medium text-highlighted truncate">{{ userFullName(user) }}</p>
      <p class="text-xs text-muted truncate mt-0.5">{{ user.email }}</p>
    </div>

    <div class="flex flex-wrap justify-center gap-1 mt-auto">
      <UBadge
          v-if="!user.isActive"
          label="Отключён"
          color="neutral"
          variant="subtle"
          size="sm"
      />
      <UBadge
          v-for="role in user.roles"
          :key="role"
          :label="ROLE_LABELS[role]"
          color="neutral"
          variant="outline"
          size="sm"
      />
    </div>
  </NuxtLink>
</template>