<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const api = useApi()
const toast = useToast()

interface WallpaperSettings {
  enabled: boolean
  intervalMs: number
  overlayOpacity: number
}

const DEFAULTS: WallpaperSettings = { enabled: true, intervalMs: 60_000, overlayOpacity: 0.3 }

const form = reactive<WallpaperSettings>({ ...DEFAULTS })
const snapshot = ref(JSON.stringify(DEFAULTS))
const loading = ref(false)
const saving = ref(false)

const intervalOptions = [
  { label: '15 секунд', value: 15_000 },
  { label: '30 секунд', value: 30_000 },
  { label: '1 минута', value: 60_000 },
  { label: '3 минуты', value: 180_000 },
  { label: '10 минут', value: 600_000 },
  { label: '30 минут', value: 1_800_000 },
]

function current(): WallpaperSettings {
  return { enabled: form.enabled, intervalMs: form.intervalMs, overlayOpacity: form.overlayOpacity }
}

function apply(value: WallpaperSettings) {
  Object.assign(form, value)
  snapshot.value = JSON.stringify(current())
}

const isDirty = computed(() => JSON.stringify(current()) !== snapshot.value)

// USlider отдаёт массив — разворачиваем в число
const overlayOpacity = computed({
  get: () => form.overlayOpacity,
  set: (val: number | number[]) => {
    form.overlayOpacity = Array.isArray(val) ? (val[0] ?? 0) : val
  },
})

// Загружаем свежие настройки при каждом открытии
watch(open, async (value) => {
  if (!value) return
  loading.value = true
  try {
    const data = await api<Partial<WallpaperSettings>>('/api/settings/wallpaper')
    apply({
      enabled: data.enabled ?? DEFAULTS.enabled,
      intervalMs: data.intervalMs ?? DEFAULTS.intervalMs,
      overlayOpacity: data.overlayOpacity ?? DEFAULTS.overlayOpacity,
    })
  } catch (e: any) {
    toast.add({ title: 'Не удалось загрузить настройки', description: e?.data?.message, color: 'error' })
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await api('/api/settings/wallpaper', { method: 'PATCH', body: current() })
    snapshot.value = JSON.stringify(current())
    toast.add({ title: 'Настройки сохранены', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Не удалось сохранить', description: e?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

function cancel() {
  apply(JSON.parse(snapshot.value))
}
</script>

<template>
  <UModal
      v-model:open="open"
      title="Настройки обоев"
      :dismissible="!isDirty"
      :close="!isDirty"
      :ui="{ content: 'max-w-xl', footer: 'justify-end' }"
  >
    <template #body>
      <p v-if="loading" class="text-muted">Загрузка...</p>

      <div v-else class="space-y-5">
        <USwitch v-model="form.enabled" label="Показывать обои"/>

        <UFormField label="Интервал смены">
          <USelect
              v-model="form.intervalMs"
              :items="intervalOptions"
              :disabled="!form.enabled"
              class="w-full"
          />
        </UFormField>

        <UFormField label="Затемнение" :hint="`${Math.round(overlayOpacity * 100)}%`">
          <USlider
              v-model="overlayOpacity"
              :min="0"
              :max="0.8"
              :step="0.05"
              :disabled="!form.enabled"
          />
        </UFormField>

        <div
            class="h-32 rounded-sm relative overflow-hidden"
            style="background-image: linear-gradient(135deg, #7fb4d8, #f2d79e 45%, #5d87a0)"
        >
          <div class="absolute inset-0" :style="{ background: `rgba(25,50,70,${form.overlayOpacity})` }"/>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="bg-white/70 ring ring-inset ring-white/55 rounded-sm px-5 py-3 text-sm">
              Пример формы
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <template v-if="isDirty">
        <UButton label="Отмена" class="w-[130px] justify-center" :disabled="saving" @click="cancel"/>
        <UButton label="Сохранить" class="w-[130px] justify-center" :loading="saving" @click="save"/>
      </template>
      <UButton v-else label="Закрыть" class="w-[130px] justify-center" @click="open = false"/>
    </template>
  </UModal>
</template>