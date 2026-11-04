import type { ReaderArticle } from '~~/shared/types/reader'

export function useInvite(token: string) {
    return useFetch<{
        space: { id: string; name: string; description: string | null }
        articles: ReaderArticle[]
    }>(`/api/view/${token}`, { key: `invite:${token}` })
}