<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { FONT_SIZES, DEFAULT_FONT_SIZE } from './fontOptions'

const props = defineProps<{ editor: Editor }>()

const current = computed({
  get: () => props.editor.getAttributes('textStyle').fontSize || DEFAULT_FONT_SIZE,
  set: (value: string) => {
    value === DEFAULT_FONT_SIZE
      ? props.editor.chain().unsetFontSize().run()
      : props.editor.chain().setFontSize(value).run()
  }
})
</script>

<template>
  <USelect
    v-model="current"
    :items="FONT_SIZES"
    :disabled="editor.isActive('heading')"
    class="w-20"
  />
</template>
