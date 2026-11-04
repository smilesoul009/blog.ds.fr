<script setup lang="ts">
import {WallpaperSlot, type WallpaperDevice} from '@prisma/client'
import {
  WALLPAPER_DEVICE_LABELS,
  WALLPAPER_SLOT_LABELS,
} from '~~/shared/constants/wallpaper'
import {toOptions} from '~~/shared/constants/enums'

const api = useApi()
const toast = useToast()

interface Wallpaper {
  id: string
  fileName: string
  url: string
  thumbUrl: string
  device: WallpaperDevice
  width: number
  height: number
  sizeBytes: number
  assignments: { slot: WallpaperSlot }[]
}

const deviceFilter = ref<WallpaperDevice>('DESKTOP')
const activeSlot = ref<WallpaperSlot>(WallpaperSlot?.APP)

const {data, refresh, status} = await useFetch<Wallpaper[]>('/api/wallpapers', {
  query: computed(() => ({device: deviceFilter.value})),
})

const items = computed(() => data.value ?? [])
const deviceOptions = toOptions(WALLPAPER_DEVICE_LABELS)

const SLOT_ICONS: Record<WallpaperSlot, string> = {
  LOGIN: 'i-lucide-log-in',
  APP: 'i-lucide-layout-dashboard',
  LOGOUT: 'i-lucide-log-out',
  CLIENT: 'i-lucide-book-open',
}

const slotButtons = computed(() =>
    (Object.keys(WALLPAPER_SLOT_LABELS) as WallpaperSlot[]).map(slot => ({
      slot,
      label: WALLPAPER_SLOT_LABELS[slot],
      icon: SLOT_ICONS[slot],
      count: items.value.filter(i => i.assignments.some(a => a.slot === slot)).length,
    })),
)

function isAssigned(item: Wallpaper, slot: WallpaperSlot) {
  return item.assignments.some(a => a.slot === slot)
}

const pending = ref<string | null>(null)

async function toggleSlot(item: Wallpaper) {
  if (!activeSlot.value) {
    toast.add({
      title: 'Не выбран тип страницы',
      description: 'Для настройки, вам необходимо сначала выбрать тип страниц, для которых вы выбираете фон.',
      color: 'warning'
    })
    return
  }

  pending.value = item.id

  try {
    const result = await api<{ assigned: boolean }>(
        `/api/wallpapers/${item.id}/slots/${activeSlot.value}`,
        {method: 'POST'},
    )

    const target = data.value?.find(w => w.id === item.id)
    if (!target) return

    if (result.assigned) {
      target.assignments = [...target.assignments, {slot: activeSlot.value}]
    } else {
      target.assignments = target.assignments.filter(a => a.slot !== activeSlot.value)
    }
  } catch (e: any) {
    toast.add({title: 'Не удалось изменить', description: e?.data?.message, color: 'error'})
  } finally {
    pending.value = null
  }
}

const uploadFile = ref<File | null>(null)
const uploading = ref(false)

watch(uploadFile, async (file) => {
  if (!file) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('device', deviceFilter.value)

    await $fetch('/api/wallpapers', {method: 'POST', body: formData})
    await refresh()
    toast.add({title: 'Изображение загружено', color: 'success'})
  } catch (e: any) {
    toast.add({title: 'Не удалось загрузить', description: e?.data?.message, color: 'error'})
  } finally {
    uploading.value = false
    uploadFile.value = null
  }
})

const preview = ref<Wallpaper | null>(null)
const previewOpen = ref(false)
const settingsOpen = ref(false)

function openPreview(item: Wallpaper) {
  preview.value = item
  previewOpen.value = true
}

async function remove(item: Wallpaper) {
  try {
    await api(`/api/wallpapers/${item.id}`, {method: 'DELETE'})
    await refresh()
    previewOpen.value = false
  } catch (e: any) {
    toast.add({title: 'Не удалось удалить', description: e?.data?.message, color: 'error'})
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

function slotNames(item: Wallpaper) {
  return item.assignments.map(a => WALLPAPER_SLOT_LABELS[a.slot]).join(', ')
}
</script>

<template>
  <ClientOnly>
    <Page>
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <Header class="ms-4">Обои</Header>
          <div class="flex items-center gap-2">
            <USeparator orientation="vertical" class="h-8"/>
            <span>Добавить картинку</span>
            <USelect v-model="deviceFilter" :items="deviceOptions" class="w-52"/>
            <UFileUpload
                v-slot="{ open }"
                v-model="uploadFile"
                accept="image/jpeg,image/png,image/webp"
                :preview="false"
                class="contents"
            >
              <UButton
                  icon="i-lucide-upload"
                  label="Загрузить"
                  :loading="uploading"
                  class="w-[130px] justify-center"
                  @click="open()"
              />
            </UFileUpload>
            <USeparator orientation="vertical" class="h-8"/>
            <UButton
                icon="i-lucide-settings"
                label="Настройки"
                class="w-[130px] justify-center"
                @click="settingsOpen = true"
            />
          </div>
        </div>
      </template>

      <template #toolbar>
        <div class="flex flex-wrap gap-2">
          <UButton
              v-for="btn in slotButtons"
              :key="btn.slot"
              :icon="btn.icon"
              :label="`${btn.label} (${btn.count})`"
              :class="activeSlot === btn.slot ? 'bg-sub-400!' : ''"
              @click="activeSlot = btn.slot"
          />
        </div>
      </template>

      <p v-if="status === 'pending'" class="text-muted">Загрузка...</p>
      <p v-else-if="!items?.length" class="text-muted">
        Изображений нет. Загрузите первое — оно появится здесь.
      </p>

      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
            v-for="item in items"
            :key="item.id"
            class="relative bg-white/70 ring ring-inset rounded-sm overflow-hidden transition duration-200"
            :class="isAssigned(item, activeSlot) ? 'ring-2 ring-sub-550' : 'ring-default'"
        >
          <button
              type="button"
              class="block w-full text-left"
              :disabled="pending === item.id"
              @click="toggleSlot(item)"
          >
            <div class="aspect-video bg-sub-200 overflow-hidden">
              <img :src="item.thumbUrl" :alt="item.fileName" class="w-full h-full object-cover">
            </div>

            <div class="p-3 space-y-1">
              <p class="text-sm truncate">{{ item.fileName }}</p>
              <p class="text-xs text-dimmed">
                {{ item.width }}×{{ item.height }} · {{ formatSize(item.sizeBytes) }}
              </p>
              <p v-if="item.assignments?.length" class="text-xs text-toned">
                {{ slotNames(item) }}
              </p>
              <p v-else class="text-xs text-dimmed">Не используется</p>
            </div>
          </button>

          <div
              v-if="isAssigned(item, activeSlot)"
              class="absolute top-2 left-2 size-7 rounded-xs bg-white/85 ring ring-inset ring-accented flex items-center justify-center"
          >
            <UIcon name="i-lucide-check" class="size-4 text-highlighted"/>
          </div>

          <UButton
              icon="i-lucide-eye"
              class="absolute top-2 right-2 size-8 justify-center bg-white/85!"
              @click.stop="openPreview(item)"
          />
        </div>
      </div>

      <UModal v-model:open="previewOpen" :title="preview?.fileName" :ui="{ content: 'max-w-3xl' }">
        <template #body>
          <div v-if="preview" class="space-y-4">
            <div class="relative aspect-video rounded-sm overflow-hidden bg-sub-200">
              <img :src="preview.url" :alt="preview.fileName" class="w-full h-full object-cover">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-[280px] bg-white/70 ring ring-inset ring-white/55 rounded-sm p-5 text-center">
                  <p class="text-lg text-highlighted mb-2">Добро пожаловать</p>
                  <p class="text-xs text-toned mb-4">Так форма будет выглядеть на этом фоне</p>
                  <div
                      class="h-9 w-[130px] mx-auto bg-control-base ring ring-inset ring-accented rounded-xs flex items-center justify-center text-sm">
                    Вход
                  </div>
                </div>
              </div>
            </div>

            <p class="text-sm text-toned">
              {{ preview.assignments?.length ? `Используется: ${slotNames(preview)}` : 'Не используется' }}
            </p>

            <div class="flex justify-between gap-2">
              <UButton label="Удалить" class="w-[130px] justify-center" @click="remove(preview)"/>
              <UButton label="Закрыть" class="w-[130px] justify-center" @click="previewOpen = false"/>
            </div>
          </div>
        </template>
      </UModal>
      <WallpaperSettingsModal v-model:open="settingsOpen"/>
    </Page>
  </ClientOnly>
</template>