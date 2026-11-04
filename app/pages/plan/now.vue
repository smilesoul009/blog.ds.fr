<script setup lang="ts">
import {isPlanScope, periodKeyFor, todayISO} from '~~/shared/utils/planDates'

// «Планы»: открыть последний вид периода на сегодня (параметры, например ?trash=tasks, передаём дальше)
const lastScope = usePlanScope()
const route = useRoute()

onMounted(() => {
  const scope = isPlanScope(lastScope.value) ? lastScope.value : 'day'
  navigateTo({path: `/plan/${scope}/${periodKeyFor(scope, todayISO())}`, query: route.query}, {replace: true})
})
</script>

<template>
  <Page>
    <p class="text-muted">Загрузка...</p>
  </Page>
</template>