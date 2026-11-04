<script setup lang="ts">
import type {TrashKind} from '~~/shared/constants/trash'

// Значок «Удалённые» со счётчиком в стандартном месте. Нет удалённых — нет значка.
// popover — список во всплывающей панели (внутри окна: окно поверх окна не открываем), иначе — в окне UModal.
// Ссылка ?trash=<kind> открывает список сразу (так ведёт уведомление перед удалением навсегда)
const props = defineProps<{ kind: TrashKind; goalId?: string; popover?: boolean }>()
const emit = defineEmits<{ changed: [] }>()

const api = useApi()
const route = useRoute()
const router = useRouter()
const tick = useTrashTick(props.kind)

const count = ref(0)
const open = ref(false)

async function loadCount() {
  try {
    const res = await api<{ count: number }>(`/api/trash/${props.kind}`, {query: {count: '1', goalId: props.goalId}})
    count.value = res.count
  } catch {
    // не страшно: значок просто не покажется
  }
}

onMounted(async () => {
  await loadCount()
  if (route.query.trash === props.kind) {
    open.value = count.value > 0
    router.replace({query: {...route.query, trash: undefined}})
  }
})
watch(tick, loadCount)
watch(() => props.goalId, loadCount)

function onChanged() {
  loadCount()
  emit('changed')
}
</script>

<template>
  <template v-if="count > 0">
    <UPopover v-if="popover" v-model:open="open" :content="{ align: 'end' }" :ui="{ content: 'z-[100]' }">
      <UTooltip text="Удалённые">
        <UButton color="neutral" variant="ghost" class="relative" aria-label="Удалённые" icon="i-lucide-replace">
          <span class="text-xs tabular-nums">{{ count }}</span>
        </UButton>
      </UTooltip>
      <template #content>
        <div class="w-[32rem] p-3">
          <TrashList :kind="kind" :goal-id="goalId" @changed="onChanged" @close="open = false"/>
        </div>
      </template>
    </UPopover>

    <template v-else>
      <UTooltip text="Удалённые">
        <UButton color="neutral" variant="ghost" aria-label="Удалённые" icon="i-lucide-replace" @click="open = true">
          <span class="text-xs tabular-nums">{{ count }}</span>
        </UButton>
      </UTooltip>
      <UModal v-model:open="open" :ui="{ content: 'sm:max-w-xl' }">
        <template #content>
          <div class="p-4">
            <TrashList :kind="kind" :goal-id="goalId" @changed="onChanged" @close="open = false"/>
          </div>
        </template>
      </UModal>
    </template>
  </template>
</template>
