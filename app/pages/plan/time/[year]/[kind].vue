<script setup lang="ts">
import {todayISO} from '~~/shared/utils/planDates'
import {
  PICK_CURRENT, PICK_MODE, PICK_WHAT, TIME_LABEL, currentKey, isPickKind, isPlanYear, listPath, type PickKind,
} from '~~/shared/utils/planYears'

// Экран выбора периода (Месяц, Неделя, День, Еженедельный план): календарь выбранного года.
// Клик по дню / неделе / месяцу — список этого периода (или сетка недели). «Текущий …» — сразу текущий период;
// если выбран не текущий год, переходит на текущий год (меню слева переключится само — год берётся из адреса)
const route = useRoute()

if (!isPlanYear(route.params.year) || !isPickKind(route.params.kind)) {
  await navigateTo('/plan/time', {replace: true})
}

const year = computed(() => Number(route.params.year))
const kind = computed(() => route.params.kind as PickKind)

// Сегодня — по часам пользователя
const today = ref(todayISO())
onMounted(() => (today.value = todayISO()))
const current = computed(() => currentKey(kind.value, today.value))

const {data} = useFetch<{ keys: string[] }>('/api/plan/marks', {
  query: computed(() => ({year: year.value, kind: kind.value})),
  server: false,
})

function open(key: string) {
  navigateTo(listPath(kind.value, key))
}

// Полный экран — тот же, что у списков плана (кука), чтобы переход из меню не выходил из него
const fullscreenCookie = useCookie<boolean>('plan-fullscreen', {default: () => false, maxAge: 60 * 60 * 24 * 365, sameSite: 'lax'})
const hydrated = ref(false)
onMounted(() => (hydrated.value = true))
const fullscreen = computed({
  get: () => hydrated.value && !!fullscreenCookie.value,
  set: (v: boolean) => (fullscreenCookie.value = v),
})
</script>

<template>
  <PlanShell v-model:fullscreen="fullscreen">
    <!-- fit: рамка по высоте календаря -->
    <Page fit>
      <template #header>
        <Header>
          {{ year }} — выберите {{ PICK_WHAT[kind] }}
          <span v-if="kind === 'weekly'" class="text-toned font-normal">({{ TIME_LABEL.weekly.toLowerCase() }})</span>
          <template #right>
            <HeaderLink :to="listPath(kind, current)" :label="PICK_CURRENT[kind]" icon="i-lucide-house"/>
          </template>
        </Header>
      </template>

      <PlanYearCalendar
          :year="year"
          :mode="PICK_MODE[kind]"
          :marks="data?.keys ?? []"
          :current="current"
          @select="open"
      />
    </Page>
  </PlanShell>
</template>
