<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { TEXT_COLORS } from './fontOptions'

const props = defineProps<{ editor: Editor }>()
const open = ref(false)

const current = computed(() => props.editor.getAttributes('textStyle').color || '#000000')

function apply(color: string) {
  props.editor.chain().setColor(color).run()
  open.value = false
}

function reset() {
  props.editor.chain().unsetColor().run()
  open.value = false
}
</script>

<template>
  <UPopover v-model:open="open">
    <button
      type="button"
      aria-label="Цвет текста"
      class="inline-flex flex-col items-center justify-center rounded p-1.5 hover:bg-elevated transition-colors"
    >
      <UIcon
        name="i-lucide-baseline"
        class="size-4"
      />
      <span
        class="block w-4 h-1 rounded-full mt-0.5"
        :style="{ backgroundColor: current }"
      />
    </button>

    <template #content>
      <div class="p-3 flex flex-col gap-3 w-52">
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="color in TEXT_COLORS"
            :key="color"
            type="button"
            class="size-6 rounded-full border border-default"
            :style="{ backgroundColor: color }"
            @click="apply(color)"
          />
        </div>
        <UButton
          label="Сбросить цвет"
          color="neutral"
          variant="soft"
          size="xs"
          block
          @click="reset"
        />
      </div>
    </template>
  </UPopover>
</template>
