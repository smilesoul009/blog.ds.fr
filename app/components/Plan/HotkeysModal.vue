<script setup lang="ts">
const open = defineModel<boolean>('open', {default: false})

const KEYS = [
  {keys: ['Г', 'U'], label: 'Год'},
  {keys: ['М', 'V'], label: 'Месяц'},
  {keys: ['Н', 'Y'], label: 'Неделя (список)'},
  {keys: ['Е', 'T'], label: 'Еженедельный (сетка недели)'},
  {keys: ['Ц', 'W'], label: 'Цели'},
  {keys: ['Д', 'L'], label: 'День'},
  {keys: ['←', '→'], label: 'Предыдущий / следующий период'},
  {keys: ['С', 'C'], label: 'Сегодня'},
  {keys: ['И', 'B'], label: 'Итоги'},
  {keys: ['Т', 'N'], label: 'Новая задача (в списке)'},
  {keys: ['А', 'F'], label: 'Полный экран'},
  {keys: ['?'], label: 'Эта подсказка'},
]
</script>

<template>
  <UModal v-model:open="open" title="Горячие клавиши" description="Работают в любой раскладке, когда курсор не в поле ввода">
    <template #body>
      <div class="space-y-1.5">
        <div v-for="k in KEYS" :key="k.label" class="flex items-center gap-3 text-sm">
          <span class="flex gap-1 w-24 shrink-0">
            <UKbd v-for="key in k.keys" :key="key" :value="key"/>
          </span>
          <span class="text-toned">{{ k.label }}</span>
        </div>
      </div>
    </template>
  </UModal>
</template>