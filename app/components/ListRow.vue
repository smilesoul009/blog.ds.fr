<script setup lang="ts">
import { NuxtLink } from '#components'

defineProps<{
  to?: string
}>()
</script>

<template>
  <component
      :is="to ? NuxtLink : 'div'"
      :to="to"
      class="block bg-white/70 ring ring-inset ring-default rounded-sm p-4 transition duration-300"
      :class="to ? 'hover:bg-white/85' : ''">
    <slot />
  </component>
</template>