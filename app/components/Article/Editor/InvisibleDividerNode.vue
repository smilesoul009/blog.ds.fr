<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps<NodeViewProps>()
</script>

<template>
  <NodeViewWrapper>
    <div
        class="w-full border-t border-dashed border-default text-muted text-xs flex items-center justify-center select-none"
        :class="{ 'outline-2 outline-primary': props.selected }"
        :style="{ height: `${props.node.attrs.height}px` }"
    >
      Разделитель (невидимый на сайте)
    </div>
  </NodeViewWrapper>
</template>