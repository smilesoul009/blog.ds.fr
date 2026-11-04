<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()
</script>

<template>
  <NodeViewWrapper as="span" class="inline-block align-middle">
    <span
        class="inline-flex items-center justify-center border border-dashed border-default rounded text-muted text-[10px] select-none"
        :class="{ 'outline-2 outline-primary': props.selected }"
        :style="{ width: `${props.node.attrs.width}px`, height: '1.2em' }"
    >
      ↔{{ props.node.attrs.width }}
    </span>
  </NodeViewWrapper>
</template>