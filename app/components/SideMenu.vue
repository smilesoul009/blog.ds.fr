<script setup lang="ts">
import type {NavItem} from '~~/shared/constants/navigation'

// Боковое меню раздела. Рамка — как у окон сайта (полупрозрачная, с полупрозрачной обводкой);
// отступ до окна справа — как у верхнего меню до окна (окно даёт свой m-2).
// fill — на всю высоту (настройки); без fill — высота по пунктам, меню прижато к верху (План).
// Пункт { separator: true } — черта между группами
const props = withDefaults(defineProps<{
  items: NavItem[]
  fill?: boolean
  width?: string
  isActive?: (item: NavItem) => boolean
}>(), {
  fill: false,
  width: 'w-52',
})

const route = useRoute()

// Пункт активен на своём адресе, на вложенных адресах и на адресах из match
// (адрес с «/» на конце — только вложенные: '/plan/' подсвечивает /plan/day/…, но не /plan)
function matches(p: string) {
  if (p.endsWith('/')) return route.path.startsWith(p)
  return route.path === p || route.path.startsWith(`${p}/`)
}

function active(item: NavItem) {
  if (props.isActive) return props.isActive(item)
  return [item.to, ...(item.match ?? [])].filter((p): p is string => !!p).some(matches)
}
</script>

<template>
  <aside
      class="flex min-h-0 bg-white/40 border border-gray-50 rounded-xs ms-2 mb-2 shrink-0"
      :class="fill ? '' : 'self-start'"
  >
    <!-- Прокрутка только у меню на всю высоту (настройки): прокручиваемая область обрезает тень выбранного пункта,
         поэтому там отступы больше, чем тень (по бокам 4 px сдвиг + 7 px размытие + 2 px) -->
    <nav
        class="m-2 flex flex-col gap-1.5 bg-muted/50"
        :class="[width, fill ? 'overflow-y-auto px-3.5 py-3' : 'p-2']"
    >
      <template v-for="(item, i) in items" :key="item.to ?? `separator-${i}`">
        <div v-if="item.separator" class="h-px mx-1 my-0.5 bg-accented" role="separator"/>
        <NuxtLink
            v-else
            :to="item.to"
            class="btn-menu"
            :class="active(item) ? 'btn-menu-active' : ''"
        >
          <UIcon v-if="item.icon" :name="item.icon" class="size-4 shrink-0"/>
          {{ item.label }}
        </NuxtLink>
      </template>
    </nav>
  </aside>
</template>
