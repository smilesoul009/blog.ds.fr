export interface ReaderAuthor {
    id: string
    name: string
    avatarUrl: string | null
}

export interface ReaderArticle {
    id: string
    slug: string
    title: string
    excerpt: string
    coverUrl: string | null
    publishedAt: string | null
    assignedAt: string | null
    isStarter: boolean
    area: { id: string; name: string }
    authors: ReaderAuthor[]
    isRead?: boolean
    isFavorite?: boolean
    comment?: string | null
    assignedBy?: { firstName: string | null; lastName: string | null } | null
}