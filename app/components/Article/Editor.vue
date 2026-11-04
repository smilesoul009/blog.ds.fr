<script setup lang="ts">
import {TextAlign} from '@tiptap/extension-text-align'
import {CustomImage} from './Editor/CustomImage'
import {textStyleExtensions} from './Editor/textStyleExtensions'
import {toolbarItems} from './Editor/toolbarItems'
import {customHandlers} from './Editor/editorHandlers'
import FontFamilySelect from './Editor/FontFamilySelect.vue'
import FontSizeSelect from './Editor/FontSizeSelect.vue'
import TextColorPicker from './Editor/TextColorPicker.vue'
import {createImagePasteDropProps} from "~/components/Article/Editor/Image/PasteDrop.ts";
import {ImageUpload} from "~/components/Article/Editor/Image/UploadExtension.ts";
import ImageUploadingPlaceholder from "~/components/Article/Editor/Image/UploadingExtension.ts";

import type {JSONContent} from '@tiptap/vue-3'
import {SpacerVertical} from "~/components/Article/Editor/SpacerVertical.ts";
import {SpacerHorizontal} from "~/components/Article/Editor/SpacerHorizontal.ts";
import {InvisibleDivider} from "~/components/Article/Editor/InvisibleDivider.ts";
import {BlockId} from "~/components/Article/Editor/BlockId.ts";

const content = defineModel<JSONContent>({
  default: () => ({type: 'doc', content: [{type: 'paragraph'}]}),
})

const editorRef = useTemplateRef('editorRef')
const editorProps = createImagePasteDropProps(() => editorRef.value?.editor)

const extensions = [
  BlockId,
  CustomImage.configure({
    resize: {
      enabled: true,
      directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      minWidth: 50,
      alwaysPreserveAspectRatio: true
    }
  }),
  ImageUpload,
  ImageUploadingPlaceholder,
  SpacerVertical,
  SpacerHorizontal,
  InvisibleDivider,
  TextAlign.configure({types: ['heading', 'paragraph']}),
  ...textStyleExtensions
]

function captureCursor() {
  const editor = editorRef.value?.editor
  if (!editor) return null

  const {from} = editor.state.selection
  const resolved = editor.state.doc.resolve(from)

  for (let depth = resolved.depth; depth > 0; depth--) {
    const node = resolved.node(depth)
    if (node.attrs?.blockId) {
      return {blockId: node.attrs.blockId, offset: from - resolved.start(depth)}
    }
  }
  return null
}

function restoreCursor(saved: { blockId: string; offset: number } | null) {
  const editor = editorRef.value?.editor
  if (!editor) return

  if (!saved) {
    editor.commands.focus('end')
    return
  }

  let target: number | null = null

  editor.state.doc.descendants((node, pos) => {
    if (target !== null) return false
    if (node.attrs?.blockId === saved.blockId) {
      target = pos + 1 + Math.min(saved.offset, node.content.size)
      return false
    }
    return true
  })

  if (target === null) {
    editor.commands.focus('end')
  } else {
    editor.commands.setTextSelection(target)
  }
}

defineExpose({
  getPlainText: () => editorRef.value?.editor?.getText() ?? '',
  captureCursor,
  restoreCursor,
})


const toolbarMounted = ref(false)
onMounted(() => {
  toolbarMounted.value = !!document.getElementById('editor-toolbar')
})
</script>

<template>
  <div class="article-editor  bg-white/70 ring ring-inset ring-default border border-default rounded-md p-4">
    <UEditor
        ref="editorRef"
        v-slot="{ editor }"
        v-model="content"
        content-type="json"
        :starter-kit="{ heading: { levels: [1, 2, 3] } }"
        :image="false"
        :extensions="extensions"
        :handlers="customHandlers"
        :editorProps="editorProps"
        :ui="{content: 'article-content'}"
        placeholder="Начните писать текст..."
    >
      <Teleport to="#editor-toolbar" :disabled="!toolbarMounted">
        <div class="sticky -top-6 z-10 bg-default flex flex-wrap items-center gap-1 mb-4 border-b border-default p-1">
          <FontFamilySelect :editor="editor"/>
          <FontSizeSelect :editor="editor"/>
          <TextColorPicker :editor="editor"/>
          <UEditorToolbar
              :editor="editor"
              :items="toolbarItems"
              class="flex-wrap"
          />
        </div>
      </Teleport>
    </UEditor>
  </div>
</template>

<style scoped>
:deep(.tiptap.ProseMirror) {
  outline: none;
  min-height: 60vh;
}

:deep([data-resize-container]) {
  max-width: 100%;
}

/* Обтекание и отступы картинки в редакторе задаёт рамка изменения размера (контейнер ниже).
   Если оставить float у самой картинки (article-content.css: img.align-left / align-right), рамка внутри
   схлопывается по высоте — нижние уголки оказываются наверху рядом с верхними */
:deep([data-resize-container] img) {
  float: none !important;
  margin: 0 !important;
  display: block;
}

:deep([data-resize-wrapper]) {
  position: relative;
  display: block;
}

:deep([data-resize-container]:has(img.align-left)) {
  float: left !important;
  display: block !important;
  margin: 0.25rem 1.25rem 0.75rem 0;
}

:deep([data-resize-container]:has(img.align-right)) {
  float: right !important;
  display: block !important;
  margin: 0.25rem 0 0.75rem 1.25rem;
}

:deep([data-resize-container]:has(img.align-center)) {
  float: none !important;
  display: table !important;
  margin-inline: auto;
}

:deep([data-resize-handle]) {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--ui-primary);
  border: 1px solid white;
  border-radius: 2px;
}

:deep([data-resize-handle="top-left"]) {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}

:deep([data-resize-handle="top-right"]) {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}

:deep([data-resize-handle="bottom-left"]) {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}

:deep([data-resize-handle="bottom-right"]) {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}
</style>
