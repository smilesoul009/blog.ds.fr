<script setup lang="ts">
const props = defineProps<{ articleId: string; reason?: string | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ done: [] }>()

const api = useApi()
const toast = useToast()

const text = ref('')
const saving = ref(false)
const isEdit = computed(() => !!props.reason)

watch(open, (isOpen) => {
  if (isOpen) text.value = props.reason ?? ''
})

async function submit() {
  saving.value = true
  try {
    await api(`/api/articles/${props.articleId}/block`, {
      method: 'POST',
      body: { reason: text.value },
    })
    toast.add({ title: isEdit.value ? 'Причина изменена' : 'Статья заблокирована', color: 'success' })
    open.value = false
    emit('done')
  } catch (e: any) {
    toast.add({ title: 'Не удалось сохранить', description: e?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="isEdit ? 'Изменить причину блокировки' : 'Заблокировать статью'">
    <template #body>
      <div class="space-y-4">
        <p v-if="!isEdit" class="text-sm text-toned">
          Клиенты перестанут видеть статью. Автор увидит причину и сможет ответить.
          Назначения и подборки сохранятся — после разблокировки статья вернётся на свои места.
        </p>

        <UFormField label="Причина" required>
          <UTextarea v-model="text" :rows="4" autoresize class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Отмена" class="w-[130px] justify-center" @click="open = false" />
          <UButton
              :label="isEdit ? 'Сохранить' : 'Заблокировать'"
              class="w-[130px] justify-center"
              :loading="saving"
              :disabled="!text.trim()"
              @click="submit"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>