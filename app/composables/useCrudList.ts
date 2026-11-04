export function useCrudList<T>(endpoint: string, options: {
    defaultLimit?: number
    filters?: Record<string, Ref<any>>
} = {}) {
    const page = ref(1)
    const limit = ref(options.defaultLimit ?? 20)
    const search = ref('')

    const query = computed(() => {
        const q: Record<string, any> = {
            page: page.value,
            limit: limit.value,
        }
        if (search.value) q.search = search.value

        for (const [key, source] of Object.entries(options.filters ?? {})) {
            if (source.value !== undefined && source.value !== null && source.value !== '') {
                q[key] = source.value
            }
        }
        return q
    })

    const { data, status, refresh } = useFetch<{
        items: T[]
        total: number
        page: number
        limit: number
        totalPages: number
    }>(endpoint, { query, watch: [query] })

    watch(search, () => { page.value = 1 })

    return {
        items: computed(() => data.value?.items ?? []),
        total: computed(() => data.value?.total ?? 0),
        totalPages: computed(() => data.value?.totalPages ?? 0),
        page,
        limit,
        search,
        pending: computed(() => status.value === 'pending'),
        refresh,
    }
}