<script setup lang="ts">
import {type NodeViewProps, NodeViewWrapper} from '@tiptap/vue-3'
const props = defineProps<NodeViewProps>()
</script>

<template>
  <NodeViewWrapper>
    <div class="flex items-center justify-center gap-2 min-h-32 rounded-md border border-dashed border-default bg-elevated/50 text-muted text-sm">
      <UIcon name="i-lucide-loader-circle" class="animate-spin size-5" />
      Загрузка изображения...
    </div>
  </NodeViewWrapper>
</template>