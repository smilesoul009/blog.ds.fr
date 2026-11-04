export function findCoverUrl(node: any): string | null {
    if (!node) return null
    if (node.type === 'image' && node.attrs?.src) return node.attrs.src
    for (const child of node.content ?? []) {
        const found = findCoverUrl(child)
        if (found) return found
    }
    return null
}

const TEXT_BLOCKS = ['paragraph', 'blockquote', 'bulletList', 'orderedList', 'listItem']

function collectText(node: any, out: string[]) {
    if (!node) return
    if (node.type === 'heading') return
    if (node.type === 'text' && node.text) out.push(node.text)
    for (const child of node.content ?? []) collectText(child, out)
    if (TEXT_BLOCKS.includes(node.type)) out.push(' ')
}

export function makeExcerpt(content: any, max = 180): string {
    const parts: string[] = []
    collectText(content, parts)
    const clean = parts.join('').replace(/\s+/g, ' ').trim()
    if (clean.length <= max) return clean

    const cut = clean.slice(0, max)
    const space = cut.lastIndexOf(' ')
    const trimmed = space > max * 0.6 ? cut.slice(0, space) : cut
    return `${trimmed.replace(/[.,;:!?—-]+$/, '')}…`
}

export const readerArticleSelect = {
    id: true,
    title: true,
    slug: true,
    isStarter: true,
    publishedAt: true,
    content: true,
    area: { select: { id: true, name: true } },
    authors: {
        select: { user: { select: { id: true, firstName: true, lastName: true } } },
    },
} as const

export function toReaderItem(article: any) {
    return {
        id: article.id,
        slug: article.slug,
        title: article.title,
        isStarter: article.isStarter,
        publishedAt: article.publishedAt,
        area: article.area,
        coverUrl: findCoverUrl(article.content),
        excerpt: makeExcerpt(article.content),
        authors: article.authors.map((a: any) => ({
            id: a.user.id,
            name: [a.user.firstName, a.user.lastName].filter(Boolean).join(' ') || 'Автор',
            avatarUrl: null,
        })),
    }
}