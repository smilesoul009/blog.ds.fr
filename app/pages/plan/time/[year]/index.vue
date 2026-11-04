<script setup lang="ts">
import {isPlanYear} from '~~/shared/utils/planYears'

// Год выбран: слева «Год, Месяц, Неделя, День | Еженедельный план»; пока вид не выбран — окна нет, видна заставка
const route = useRoute()
if (!isPlanYear(route.params.year)) await navigateTo('/plan/time', {replace: true})
</script>

<template>
  <div class="flex-1"/>
</template>
