<script setup lang="ts">
import type { BlockReviewItem } from '~/composables/useBlockReviews'

const props = defineProps<{
    item: BlockReviewItem | undefined
    canReview: boolean
    canResolve: boolean
}>()

const emit = defineEmits<{
    approve: []
    reject: [comment: string]
    clear: []
    resolve: [comment?: string]
}>()

const rejectOpen = ref(false)
const rejectComment = ref('')

const state = computed(() => props.item?.state ?? 'pending')

const badge = computed(() => {
    switch (state.value) {
        case 'approved': return { label: 'Одобрено', color: 'success' }
        case 'rejected': return { label: 'Отклонено', color: 'error' }
        case 'stale': return { label: 'Изменено после проверки', color: 'warning' }
        default: return { label: 'Не проверено', color: 'neutral' }
    }
})

function submitReject() {
    if (!rejectComment.value.trim()) return
    emit('reject', rejectComment.value.trim())
    rejectComment.value = ''
    rejectOpen.value = false
}
</script>

<template>
<div class="rounded-md border border-default p-3 space-y-2 bg-white">
<div class="flex items-center justify-between gap-2">
    <UBadge :label="badge.label" :color="badge.color as any" variant="subtle" size="sm" />

    <div v-if="canReview" class="flex gap-1">
<UButton
    icon="i-lucide-check"
size="xs"
color="success"
variant="ghost"
:disabled="state === 'approved'"
@click="emit('approve')"
/>
<UButton
    icon="i-lucide-x"
size="xs"
color="error"
variant="ghost"
@click="rejectOpen = true"
    />
    <UButton
        v-if="item?.review"
    icon="i-lucide-rotate-ccw"
size="xs"
color="neutral"
variant="ghost"
@click="emit('clear')"
    />
    </div>
    </div>

    <div v-if="item?.review?.comment" class="text-sm">
<p class="text-muted">{{ item.review.comment }}</p>
<p class="text-xs text-dimmed mt-1">
    {{ [item.review.reviewer.firstName, item.review.reviewer.lastName].filter(Boolean).join(' ') }}
</p>
</div>

<div v-if="item?.review?.resolvedAt" class="text-xs text-dimmed border-t border-default pt-2">
    Автор отметил как исправленное
<template v-if="item.review.resolvedComment">: {{ item.review.resolvedComment }}</template>
</div>

<UButton
v-if="canResolve && state === 'rejected' && !item?.review?.resolvedAt"
    label="Исправил"
size="xs"
color="neutral"
variant="soft"
block
@click="emit('resolve')"
    />

    <UModal v-model:open="rejectOpen" title="Причина отклонения">
<template #body>
<div class="space-y-3">
<UTextarea
    v-model="rejectComment"
placeholder="Что нужно исправить"
:rows="4"
class="w-full"
/>
<div class="flex justify-end gap-2">
<UButton label="Отмена" color="neutral" variant="ghost" @click="rejectOpen = false" />
<UButton label="Отклонить" color="error" :disabled="!rejectComment.trim()" @click="submitReject" />
    </div>
    </div>
    </template>
    </UModal>
    </div>
    </template>