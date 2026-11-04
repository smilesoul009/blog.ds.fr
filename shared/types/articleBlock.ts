export interface BlockPerson {
    id: string
    firstName: string | null
    lastName: string | null
    username: string
}

export interface ArticleBlock {
    at: string
    by: BlockPerson | null
    reason: string | null
    reply: string | null
    replyAt: string | null
    replyBy: BlockPerson | null
}

export function blockPersonName(person?: BlockPerson | null) {
    if (!person) return ''
    return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.username
}