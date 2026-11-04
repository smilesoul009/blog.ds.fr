import type {ArticleStatus} from '@prisma/client'

export interface StaffArticleItem {
    id: string
    title: string
    slug: string
    status: ArticleStatus
    updatedAt: string
    blockedAt: string | null
    coverUrl: string | null
    excerpt: string
    area: { id: string; name: string }
    authors: { user: { id: string; firstName: string | null; lastName: string | null } }[]
}