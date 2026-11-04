<script setup lang="ts">
defineProps<{
  isDirty: boolean
  saving?: boolean
  disabled?: boolean
  closeTo?: string
}>()

const emit = defineEmits<{ save: []; reset: []; close: [] }>()
</script>

<template>
  <div class="flex justify-end gap-2">
    <template v-if="isDirty">
      <UButton label="Отмена" class="w-[130px] justify-center" @click="emit('reset')" />
      <UButton
          label="Сохранить"
          class="w-[130px] justify-center"
          :loading="saving"
          :disabled="disabled"
          @click="emit('save')"
      />
    </template>
    <template v-else>
      <UButton
          v-if="closeTo"
          label="Закрыть"
          class="w-[130px] justify-center"
          :to="closeTo"
      />
      <UButton v-else label="Закрыть" class="w-[130px] justify-center" @click="emit('close')" />
    </template>
  </div>
</template>