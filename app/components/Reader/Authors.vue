<script setup lang="ts">
import type { ReaderAuthor } from '~~/shared/types/reader'

const props = defineProps<{ authors: ReaderAuthor[] }>()

const single = computed(() => props.authors.length === 1 ? props.authors[0] : null)
const names = computed(() => props.authors.map(a => a.name).join(', '))
</script>

<template>
  <div v-if="single" class="flex items-center gap-1.5 min-w-0">
    <UAvatar
        size="xs"
        :src="avatarFor(single)"
        :alt="single.name"
        icon="i-lucide-user"
    />
    <span class="text-xs text-muted truncate">{{ single.name }}</span>
  </div>

  <UTooltip v-else-if="authors.length" :text="names">
    <UAvatarGroup size="xs" :max="3">
      <UAvatar
          v-for="author in authors"
          :key="author.id"
          :src="avatarFor(author)"
          :alt="author.name"
          icon="i-lucide-user"
      />
    </UAvatarGroup>
  </UTooltip>
</template>