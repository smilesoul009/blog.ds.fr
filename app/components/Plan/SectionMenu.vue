<script setup lang="ts">
import type {NavItem} from '~~/shared/constants/navigation'
import {PLAN_TIME_PATHS} from '~~/shared/constants/navigation'
import {todayISO} from '~~/shared/utils/planDates'
import {TIME_KINDS, TIME_LABEL, kindPath, planYears, timeFromPath} from '~~/shared/utils/planYears'

// Меню раздела «План» в три яруса (SideMenu друг под другом, отступ 8 px):
// «Временные / Целевые»; у «Временных» — годы (текущий и 4 следующих); у выбранного года —
// «Год, Месяц, Неделя, День | Еженедельный план». Год и вид берутся из адреса — меню подсвечивает их и на списках.
// Меню видно и в полноэкранном режиме плана
const {planItems} = useNavigation()
const route = useRoute()

// Сегодня — по часам пользователя (в браузере)
const today = ref(todayISO())
onMounted(() => (today.value = todayISO()))

const inTime = computed(() => PLAN_TIME_PATHS.some(p =>
    p.endsWith('/') ? route.path.startsWith(p) : route.path === p || route.path.startsWith(`${p}/`)))

const where = computed(() => timeFromPath(route.path))

const yearItems = computed<NavItem[]>(() =>
    planYears(today.value, where.value.year)
        .map(y => ({label: String(y), to: `/plan/time/${y}`}))
        .filter(y => where.value.year ? y?.label === String(where.value.year) : true)
)

const kindItems = computed<NavItem[]>(() => {
  const year = where.value.year
  if (!year) return []
  return TIME_KINDS.flatMap(kind => [
    ...(kind === 'weekly' ? [{label: '', separator: true}] : []),
    {label: TIME_LABEL[kind], to: kindPath(year, kind)},
  ])
})

const yearActive = (item: NavItem) => item.label === String(where.value.year)
const kindActive = (item: NavItem) => !!where.value.kind && item.label === TIME_LABEL[where.value.kind]
</script>

<template>
  <div class="flex flex-col shrink-0 self-start ove">
    <SideMenu :items="planItems" width="w-44"/>
    <SideMenu v-if="inTime" :items="yearItems" :is-active="yearActive" width="w-44"/>
    <SideMenu v-if="inTime && kindItems.length" :items="kindItems" :is-active="kindActive" width="w-44"/>
  </div>
</template>
