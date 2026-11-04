<script setup lang="ts">
import { blockPersonName, type ArticleBlock } from '~~/shared/types/articleBlock'

const props = defineProps<{
  articleId: string
  block: ArticleBlock
  canReply?: boolean
}>()
const emit = defineEmits<{ replied: [text: string] }>()

const api = useApi()
const toast = useToast()

const draft = ref(props.block.reply ?? '')
const editing = ref(!props.block.reply)
const sending = ref(false)

watch(() => props.block.reply, (reply) => {
  draft.value = reply ?? ''
  editing.value = !reply
})

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('ru', { dateStyle: 'short', timeStyle: 'short' }) : ''
}

async function send() {
  const text = draft.value.trim()
  if (!text) return
  sending.value = true
  try {
    await api(`/api/articles/${props.articleId}/block-reply`, { method: 'POST', body: { text } })
    toast.add({ title: 'Ответ отправлен', color: 'success' })
    editing.value = false
    emit('replied', text)
  } catch (e: any) {
    toast.add({ title: 'Не удалось отправить', description: e?.data?.message, color: 'error' })
  } finally {
    sending.value = false
  }
}

function cancel() {
  draft.value = props.block.reply ?? ''
  editing.value = false
}
</script>

<template>
  <div class="space-y-3 px-2">
    <div class="flex gap-3">
      <UIcon name="i-lucide-lock" class="size-5 shrink-0 text-toned mt-0.5" />
      <div class="min-w-0 space-y-1">
        <p class="text-sm font-medium text-highlighted">Статья заблокирована — клиенты её не видят</p>
        <p class="text-xs text-dimmed">
          {{ blockPersonName(block.by) || 'Администратор' }} · {{ formatDate(block.at) }}
        </p>
        <p class="text-sm text-default whitespace-pre-line">{{ block.reason }}</p>
      </div>
    </div>

    <!-- Ответ автора -->
    <div v-if="block.reply && !editing" class="ms-8 border-l-2 border-default pl-3 space-y-1">
      <p class="text-xs text-dimmed">
        Ответ · {{ blockPersonName(block.replyBy) }} · {{ formatDate(block.replyAt) }}
      </p>
      <p class="text-sm text-default whitespace-pre-line">{{ block.reply }}</p>
      <UButton
          v-if="canReply"
          label="Изменить ответ"
          size="xs"
          variant="link"
          class="px-0"
          @click="editing = true"
      />
    </div>

    <div v-if="canReply && editing" class="ms-8 space-y-2">
      <UTextarea
          v-model="draft"
          :rows="2"
          autoresize
          placeholder="Ответ администратору: что исправлено или что нужно уточнить"
          class="w-full"
      />
      <div class="flex justify-end gap-2">
        <UButton
            v-if="block.reply"
            label="Отмена"
            class="w-[130px] justify-center"
            @click="cancel"
        />
        <UButton
            :label="block.reply ? 'Обновить' : 'Отправить'"
            class="w-[130px] justify-center"
            :loading="sending"
            :disabled="!draft.trim()"
            @click="send"
        />
      </div>
    </div>
  </div>
</template>