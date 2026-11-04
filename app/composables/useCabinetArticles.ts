import type { ReaderArticle } from '#shared/types/reader'

export function useCabinetArticles(filter?: 'unread' | 'favorites') {
    const api = useApi()
    const toast = useToast()

    const { data, refresh, status } = useFetch<{ items: ReaderArticle[] }>(
        '/api/cabinet/articles',
        {
            key: `cabinet-articles:${filter ?? 'all'}`,
            query: { filter },
        },
    )

    const items = ref<ReaderArticle[]>([])

    watch(
        data,
        (value) => {
            items.value = value?.items ? [...value.items] : []
        },
        { immediate: true },
    )

    async function toggleFavorite(article: ReaderArticle) {
        try {
            const result = await api<{ isFavorite: boolean }>(
                `/api/cabinet/articles/${article.id}/favorite`,
                { method: 'POST' },
            )

            const target = items.value.find(i => i.id === article.id)
            if (target) target.isFavorite = result.isFavorite

            // В «Избранном» снятая звёздочка сразу убирает карточку
            if (filter === 'favorites' && !result.isFavorite) {
                items.value = items.value.filter(i => i.id !== article.id)
            }
            await refreshNuxtData('cabinet-counts')
        } catch (e: any) {
            toast.add({
                title: e?.data?.message ?? 'Не удалось изменить избранное',
                color: 'error',
            })
        }
    }

    return {
        items,
        pending: computed(() => status.value === 'pending'),
        refresh,
        toggleFavorite,
    }
}