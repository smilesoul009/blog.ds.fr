export type BlockState = 'pending' | 'approved' | 'rejected' | 'stale'

const api = useApi()

export interface BlockReviewItem {
    blockId: string
    state: BlockState
    review: {
        id: string
        status: 'APPROVED' | 'REJECTED'
        comment: string | null
        resolvedAt: string | null
        resolvedComment: string | null
        reviewer: { id: string; firstName: string | null; lastName: string | null }
        createdAt: string
        updatedAt: string
    } | null
}

export function useBlockReviews(articleId: Ref<string> | string) {
    const id = toRef(articleId)
    const toast = useToast()

    const { data, refresh, status } = useFetch<{
        total: number
        approved: number
        pending: number
        items: BlockReviewItem[]
    }>(() => `/api/articles/${id.value}/blocks`, { watch: [id] })

    const byBlockId = computed(() => {
        const map = new Map<string, BlockReviewItem>()
        for (const item of data.value?.items ?? []) map.set(item.blockId, item)
        return map
    })

    async function approve(blockId: string) {
        try {
            await api(`/api/articles/${id.value}/blocks/${blockId}`, {
                method: 'POST',
                body: { status: 'APPROVED' },
            })
            await refresh()
        } catch (e: any) {
            toast.add({ title: 'Не удалось одобрить', description: e?.data?.message, color: 'error' })
        }
    }

    async function reject(blockId: string, comment: string) {
        try {
            await api(`/api/articles/${id.value}/blocks/${blockId}`, {
                method: 'POST',
                body: { status: 'REJECTED', comment },
            })
            await refresh()
        } catch (e: any) {
            toast.add({ title: 'Не удалось отклонить', description: e?.data?.message, color: 'error' })
        }
    }

    async function clear(blockId: string) {
        try {
            await api(`/api/articles/${id.value}/blocks/${blockId}`, { method: 'DELETE' })
            await refresh()
        } catch (e: any) {
            toast.add({ title: 'Не удалось снять вердикт', description: e?.data?.message, color: 'error' })
        }
    }

    async function resolve(blockId: string, comment?: string) {
        try {
            await api(`/api/articles/${id.value}/blocks/${blockId}/resolve`, {
                method: 'POST',
                body: { comment },
            })
            await refresh()
        } catch (e: any) {
            toast.add({ title: 'Не удалось отметить', description: e?.data?.message, color: 'error' })
        }
    }

    return {
        summary: computed(() => ({
            total: data.value?.total ?? 0,
            approved: data.value?.approved ?? 0,
            pending: data.value?.pending ?? 0,
        })),
        items: computed(() => data.value?.items ?? []),
        byBlockId,
        pending: computed(() => status.value === 'pending'),
        refresh,
        approve,
        reject,
        clear,
        resolve,
    }
}