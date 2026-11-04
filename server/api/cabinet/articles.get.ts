import { prisma } from '#server/db/client'
import { authCheck, clientCheck } from '#server/utils/checks'
import { readerArticleSelect, toReaderItem } from '#server/utils/articlePreview'
import {publicArticleWhere} from "#server/utils/articleVisibility.ts";


export default defineEventHandler(async (event) => {
    await authCheck(event)
    await clientCheck(event)

    const clientId = event.context.userId
    const query = getQuery(event) as { filter?: string }

    const links = await prisma.clientArticle.findMany({
        where: { clientId },
        select: {
            articleId: true,
            comment: true,
            assignedAt: true,
            readAt: true,
            favoritedAt: true,
            assignedBy: { select: { firstName: true, lastName: true } },
        },
    })

    const linkByArticle = new Map(links.map(l => [l.articleId, l]))

    const assignedIds = links
        .filter(l => l.assignedAt)
        .map(l => l.articleId)

    const starters = await prisma.article.findMany({
        where: { isStarter: true, ...publicArticleWhere },
        select: { id: true },
    })

    const starterIds = starters.map(s => s.id)
    const allIds = [...new Set([...assignedIds, ...starterIds])]

    if (!allIds.length) return { items: [] }

    const articles = await prisma.article.findMany({
        where: { id: { in: allIds }, ...publicArticleWhere },
        select: readerArticleSelect,
    })

    let items = articles.map((a) => {
        const link = linkByArticle.get(a.id)
        return {
            ...toReaderItem(a),
            isRead: !!link?.readAt,
            isFavorite: !!link?.favoritedAt,
            comment: link?.comment ?? null,
            assignedBy: link?.assignedBy ?? null,
            assignedAt: link?.assignedAt ?? null,
            sortDate: link?.assignedAt ?? a.publishedAt,
        }
    })

    items.sort((a, b) => {
        if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1

        const aTime = a.sortDate ? new Date(a.sortDate).getTime() : 0
        const bTime = b.sortDate ? new Date(b.sortDate).getTime() : 0
        return bTime - aTime
    })

    if (query.filter === 'unread') {
        items = items.filter(i => !i.isRead)
    } else if (query.filter === 'favorites') {
        items = items.filter(i => i.isFavorite)
    }

    return { items }
})