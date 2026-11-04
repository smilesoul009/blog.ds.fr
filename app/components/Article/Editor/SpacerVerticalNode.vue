<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()
</script>

<template>
  <NodeViewWrapper>
    <div
        class="border border-dashed border-default rounded-md text-muted text-xs flex items-center justify-center select-none"
        :class="{ 'outline-2 outline-primary': props.selected }"
        :style="{ height: `${props.node.attrs.height}px` }"
    >
      Отступ {{ props.node.attrs.height }}px
    </div>
  </NodeViewWrapper>
</template>