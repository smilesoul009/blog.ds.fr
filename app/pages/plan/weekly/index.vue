<script setup lang="ts">
import {periodKeyFor, todayISO} from '~~/shared/utils/planDates'

// «Еженедельный»: сразу текущая неделя (сетка на 7 дней — /plan/weekly/<неделя>). Сегодня — по часам пользователя
const route = useRoute()

onMounted(() => {
  navigateTo({path: `/plan/weekly/${periodKeyFor('week', todayISO())}`, query: route.query}, {replace: true})
})
</script>

<template>
  <Page>
    <p class="text-muted">Загрузка...</p>
  </Page>
</template>
