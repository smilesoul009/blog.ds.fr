<script setup lang="ts">
import {type SpaceListItem, ownerName} from '~~/shared/types/spaceList'

defineProps<{ space: SpaceListItem; to: string }>()
</script>

<template>
  <ListRow :to="to" class="p-2.5!">
    <div class="flex items-center gap-4">
      <div class="relative shrink-0 w-20 h-14 overflow-hidden rounded-xs bg-sub-200">
        <img
            v-if="space.coverUrl"
            :src="space.coverUrl"
            :alt="space.name"
            loading="lazy"
            class="absolute inset-0 w-full h-full object-cover"
        >
        <ReaderCoverPlaceholder v-else size="h-4/5"/>
      </div>

      <div class="min-w-0 flex-1">
        <p class="font-medium">{{ space.name }}</p>
        <p v-if="space.description" class="text-sm text-muted mt-1 truncate">{{ space.description }}</p>
        <p class="text-xs text-highlighted mt-1">
          {{ ownerName(space) }} · Статей: {{ space._count.articles }} · Ссылок: {{ space._count.accessLinks }}
        </p>
      </div>
    </div>
  </ListRow>
</template>