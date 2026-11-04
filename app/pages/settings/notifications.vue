<script setup lang="ts">
import {
  DAY_SLOT_ICON, DAY_SLOT_LABEL, DAY_SLOTS, NOTIFY_SCOPE_ORDER, WEEKDAY_NAMES, type NotifySettings,
} from '~~/shared/constants/notifications'
import {PLAN_SCOPE_LABELS} from '~~/shared/utils/planDates'

const api = useApi()
const toast = useToast()

interface SettingsResponse {
  timezone: string | null
  defaultTimezone: string
  settings: NotifySettings
  defaults: NotifySettings
}

const {data, error, refresh} = await useFetch<SettingsResponse>('/api/notifications/settings')

const form = ref<NotifySettings | null>(null)
const original = ref('')
const saving = ref(false)

watch(data, (d) => {
  if (!d) return
  form.value = structuredClone(d.settings)
  original.value = JSON.stringify(d.settings)
}, {immediate: true})

const isDirty = computed(() => !!form.value && JSON.stringify(form.value) !== original.value)

const browserTz = ref('')
onMounted(() => (browserTz.value = Intl.DateTimeFormat().resolvedOptions().timeZone))
const timezone = computed(() => data.value?.timezone || data.value?.defaultTimezone || '')

const weekdayItems = WEEKDAY_NAMES.map((label, i) => ({label, value: i + 1}))

const HINT: Record<string, string> = {
  day: 'Каждый день',
  week: 'Раз в неделю',
  month: 'За N дней до конца месяца (1 — в последний день)',
  year: 'За N дней до конца года',
  year2: 'За N дней до конца двухлетнего периода',
  year3: 'За N дней до конца трёхлетнего периода',
}

async function save() {
  if (!form.value) return
  saving.value = true
  try {
    await api('/api/notifications/settings', {method: 'PUT', body: form.value})
    await refresh()
    toast.add({title: 'Настройки уведомлений сохранены', color: 'success'})
  } catch (e: any) {
    toast.add({title: 'Не удалось сохранить', description: e?.data?.message, color: 'error'})
  } finally {
    saving.value = false
  }
}

function reset() {
  if (data.value) form.value = structuredClone(data.value.settings)
}

function useDefaults() {
  if (data.value) form.value = structuredClone(data.value.defaults)
}

async function updateTimezone() {
  try {
    await api('/api/notifications/timezone', {method: 'POST', body: {timezone: browserTz.value}})
    await refresh()
  } catch (e: any) {
    toast.add({title: 'Не удалось обновить часовой пояс', description: e?.data?.message, color: 'error'})
  }
}

async function sendTest() {
  try {
    await api('/api/notifications/test', {method: 'POST'})
    toast.add({title: 'Тестовое уведомление отправлено', description: 'Оно появится в колокольчике в течение минуты.'})
  } catch (e: any) {
    toast.add({title: 'Не удалось', description: e?.data?.message, color: 'error'})
  }
}
</script>

<template>
  <Page>
    <template #header>
      <Header>Уведомления</Header>
    </template>

    <p v-if="error" class="text-muted">{{ error.data?.message || 'Не удалось загрузить настройки' }}</p>

    <div v-else-if="form" class="max-w-3xl space-y-4">
      <SectionPanel title="Напоминания «подведите итоги»">
        <p class="text-sm text-toned mb-4">
          В указанное время в колокольчике появится напоминание подвести итоги периода.
          Ссылка в нём сразу открывает режим итогов. Время — по вашим часам.
        </p>

        <div class="divide-y divide-default">
          <div
              v-for="scope in NOTIFY_SCOPE_ORDER"
              :key="scope"
              class="flex items-center gap-4 py-3"
          >
            <USwitch v-model="form.periods[scope].enabled" color="neutral" :aria-label="PLAN_SCOPE_LABELS[scope]"/>
            <div class="w-56 shrink-0">
              <p class="font-medium" :class="!form.periods[scope].enabled && 'text-dimmed'">
                {{ PLAN_SCOPE_LABELS[scope] }}
              </p>
              <p class="text-xs text-dimmed">{{ HINT[scope] }}</p>
            </div>

            <div class="flex items-center gap-2" :class="!form.periods[scope].enabled && 'opacity-50'">
              <USelect
                  v-if="scope === 'week'"
                  v-model="form.periods[scope].weekday"
                  :items="weekdayItems"
                  :disabled="!form.periods[scope].enabled"
                  class="w-40"
              />
              <template v-else-if="scope !== 'day'">
                <span class="text-sm text-toned">за</span>
                <UInputNumber
                    v-model="form.periods[scope].daysBefore"
                    :min="1"
                    :max="90"
                    :disabled="!form.periods[scope].enabled"
                    class="w-28"
                />
                <span class="text-sm text-toned">дн.</span>
              </template>
              <span class="text-sm text-toned">в</span>
              <UInput
                  v-model="form.periods[scope].time"
                  type="time"
                  :disabled="!form.periods[scope].enabled"
                  class="w-28"
              />
            </div>
          </div>
        </div>

      </SectionPanel>

      <SectionPanel title="Сроки целей">
        <p class="text-sm text-toned mb-4">
          Для целей со сроком. Напоминания за одно время дня собираются в одну сводку в колокольчике.
          Достигнутые и удалённые цели не напоминают. У цели можно задать своё «скоро срок» и время
          в день срока — колокольчик в поле срока.
        </p>

        <div class="divide-y divide-default">
          <div class="flex items-center gap-4 py-3">
            <USwitch v-model="form.goals.soon.enabled" color="neutral" aria-label="Скоро срок"/>
            <div class="w-56 shrink-0">
              <p class="font-medium" :class="!form.goals.soon.enabled && 'text-dimmed'">Скоро срок</p>
              <p class="text-xs text-dimmed">За N дней до срока</p>
            </div>
            <div class="flex items-center gap-2" :class="!form.goals.soon.enabled && 'opacity-50'">
              <span class="text-sm text-toned">за</span>
              <UInputNumber
                  v-model="form.goals.soon.daysBefore"
                  :min="1"
                  :max="90"
                  size="sm"
                  :disabled="!form.goals.soon.enabled"
                  class="w-24"
              />
              <span class="text-sm text-toned">дн.</span>
              <DaySlotPicker v-model="form.goals.soon.slot" :times="form.goals.slots" :disabled="!form.goals.soon.enabled"/>
            </div>
          </div>

          <div class="flex items-center gap-4 py-3">
            <USwitch v-model="form.goals.due.enabled" color="neutral" aria-label="В день срока"/>
            <div class="w-56 shrink-0">
              <p class="font-medium" :class="!form.goals.due.enabled && 'text-dimmed'">В день срока</p>
              <p class="text-xs text-dimmed">Сегодня последний день</p>
            </div>
            <DaySlotPicker v-model="form.goals.due.slot" :times="form.goals.slots" :disabled="!form.goals.due.enabled"/>
          </div>

          <div class="flex items-center gap-4 py-3">
            <USwitch v-model="form.goals.overdue.enabled" color="neutral" aria-label="Просрочено"/>
            <div class="w-56 shrink-0">
              <p class="font-medium" :class="!form.goals.overdue.enabled && 'text-dimmed'">Просрочено</p>
              <p class="text-xs text-dimmed">На следующий день после срока</p>
            </div>
            <DaySlotPicker v-model="form.goals.overdue.slot" :times="form.goals.slots" :disabled="!form.goals.overdue.enabled"/>
          </div>

          <div class="flex items-start gap-4 py-3">
            <span class="w-9 shrink-0"/>
            <div class="w-56 shrink-0">
              <p class="font-medium">Время дня</p>
              <p class="text-xs text-dimmed">Во сколько приходят сводки</p>
            </div>
            <div class="flex flex-col gap-2">
              <label v-for="slot in DAY_SLOTS" :key="slot" class="flex items-center gap-2 text-sm text-toned">
                <UIcon :name="DAY_SLOT_ICON[slot]" class="size-4"/>
                <span class="w-12">{{ DAY_SLOT_LABEL[slot] }}</span>
                <UInput v-model="form.goals.slots[slot]" type="time" size="sm" class="w-28"/>
              </label>
            </div>
          </div>
        </div>
      </SectionPanel>

      <Panel class="flex items-center justify-between gap-2">
        <UButton label="По умолчанию" color="neutral" variant="ghost" @click="useDefaults"/>
        <FormActions :is-dirty="isDirty" :saving="saving" close-to="/dashboard" @save="save" @reset="reset"/>
      </Panel>

      <SectionPanel title="Часовой пояс и проверка">
        <div class="space-y-3 text-sm">
          <p>
            Напоминания приходят по поясу <b>{{ timezone }}</b>
            <span v-if="!data?.timezone" class="text-dimmed"> (по умолчанию, браузер ещё не сообщил свой)</span>.
          </p>
          <div v-if="browserTz && browserTz !== data?.timezone" class="flex items-center gap-3">
            <span class="text-toned">У браузера сейчас пояс {{ browserTz }}.</span>
            <UButton label="Использовать его" size="sm" @click="updateTimezone"/>
          </div>
          <div class="flex items-center gap-3">
            <UButton label="Прислать тестовое уведомление" icon="i-lucide-bell" @click="sendTest"/>
            <span class="text-dimmed">Проверить, что колокольчик работает.</span>
          </div>
        </div>
      </SectionPanel>
    </div>
  </Page>
</template>
