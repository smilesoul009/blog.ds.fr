<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { uploadImage } from './upload'

const props = defineProps<NodeViewProps>()

const file = ref<File | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

watch(file, async (selected) => {
  if (!selected) return

  loading.value = true
  error.value = null

  try {
    const url = await uploadImage(selected)
    const pos = props.getPos()
    if (typeof pos !== 'number') return

    props.editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + 1 })
        .setImage({ src: url })
        .run()
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Не удалось загрузить изображение'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
        v-model="file"
        accept="image/*"
        label="Загрузить изображение"
        description="JPG, PNG, WebP или GIF, до 10 МБ"
        :preview="false"
        class="min-h-40"
    >
      <template #leading>
        <UAvatar
            :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-image'"
            size="lg"
            :ui="{ icon: [loading && 'animate-spin'] }"
        />
      </template>
    </UFileUpload>
    <p v-if="error" class="text-error text-sm mt-2">{{ error }}</p>
  </NodeViewWrapper>
</template>