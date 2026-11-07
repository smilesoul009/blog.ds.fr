<script setup lang="ts">
import {todayISO} from '~~/shared/utils/planDates'
import {
  PICK_CURRENT, PICK_MODE, PICK_WHAT, TIME_LABEL, currentKey, isPickKind, isPlanYear, listPath, type PickKind,
} from '~~/shared/utils/planYears'

// Месяц — список месяцев; Неделя и Еженедельный план — общий список недель; День — календарь года.
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

// Общее состояние полного экрана контролируется постоянным layout «Плана».
const fullscreen = useState<boolean>('plan-fullscreen-active', () => false)

</script>

<template>
  <Page fit>
      <template #header>
        <Header>
          {{ year }} — выберите {{ PICK_WHAT[kind] }}
          <span v-if="kind === 'weekly'" class="text-toned font-normal">({{ TIME_LABEL.weekly.toLowerCase() }})</span>
          <template #right>
            <HeaderLink :to="listPath(kind, current)" :label="PICK_CURRENT[kind]" icon="i-lucide-house"/>
            <UTooltip :text="fullscreen ? 'Свернуть' : 'Развернуть'">
              <UButton
                  :icon="fullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
                  :aria-label="fullscreen ? 'Свернуть' : 'Развернуть'"
                  color="neutral"
                  variant="outline"
                  @click="fullscreen = !fullscreen"
              />
            </UTooltip>
          </template>
        </Header>
      </template>

      <PlanMonthList v-if="kind === 'month'" :year="year" :marks="data?.keys ?? []" :current="current"/>
      <PlanWeekList v-else-if="kind === 'week' || kind === 'weekly'" :year="year" :kind="kind" :marks="data?.keys ?? []" :current="current"/>
      <PlanYearCalendar
          v-else
          :year="year"
          :mode="PICK_MODE[kind]"
          :marks="data?.keys ?? []"
          :current="current"
          @select="open"
      />
  </Page>
</template>
