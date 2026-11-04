<script setup lang="ts">
import {type SpaceListItem, ownerName} from '~~/shared/types/spaceList'

const props = defineProps<{ space: SpaceListItem; to: string }>()

const owner = computed(() => [{id: props.space.owner.id, name: ownerName(props.space), avatarUrl: null}])
</script>

<template>
  <NuxtLink
      :to="to"
      class="flex flex-col page-card overflow-hidden hover:bg-white/85 transition duration-200"
  >
    <div class="relative shrink-0 aspect-[16/9] overflow-hidden bg-sub-200">
      <img
          v-if="space.coverUrl"
          :src="space.coverUrl"
          :alt="space.name"
          loading="lazy"
          class="absolute inset-0 w-full h-full object-cover"
      >
      <ReaderCoverPlaceholder v-else/>

      <div class="absolute top-2 left-2 flex flex-wrap gap-1.5">
        <UBadge :label="`Статей: ${space._count.articles}`" icon="i-lucide-files"
                color="neutral" variant="subtle" size="sm" class="bg-white"/>
        <UBadge :label="`Ссылок: ${space._count.accessLinks}`" icon="i-lucide-link"
                color="neutral" variant="subtle" size="sm" class="bg-white"/>
      </div>
    </div>

    <div class="flex-1 flex flex-col gap-1.5 p-3">
      <h3 class="font-medium text-highlighted leading-snug">{{ space.name }}</h3>
      <p v-if="space.description" class="text-sm text-muted line-clamp-3">{{ space.description }}</p>

      <div class="mt-auto pt-2">
        <ReaderAuthors :authors="owner"/>
      </div>
    </div>
  </NuxtLink>
</template>