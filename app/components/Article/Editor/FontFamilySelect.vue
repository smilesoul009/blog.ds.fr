<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { FONT_FAMILIES, DEFAULT_FONT_FAMILY } from './fontOptions'

const props = defineProps<{ editor: Editor }>()

const current = computed({
  get: () => props.editor.getAttributes('textStyle').fontFamily || DEFAULT_FONT_FAMILY,
  set: (value: string) => {
    value === DEFAULT_FONT_FAMILY
      ? props.editor.chain().unsetFontFamily().run()
      : props.editor.chain().setFontFamily(value).run()
  }
})
</script>

<template>
  <USelect
    v-model="current"
    :items="FONT_FAMILIES"
    class="w-36"
  />
</template>
