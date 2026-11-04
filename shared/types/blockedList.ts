import type {ArticleStatus} from '@prisma/client'
import type {BlockPerson} from '~~/shared/types/articleBlock'

export interface BlockedItem {
    id: string
    title: string
    status: ArticleStatus
    coverUrl: string | null
    area: { id: string; name: string }
    authors: { user: BlockPerson }[]
    blockedAt: string
    blockedBy: BlockPerson | null
    blockReason: string | null
    blockReply: string | null
    blockReplyAt: string | null
    blockReplyBy: BlockPerson | null
}

export function formatDateTime(value: string | null) {
    return value ? new Date(value).toLocaleString('ru', {dateStyle: 'short', timeStyle: 'short'}) : ''
}