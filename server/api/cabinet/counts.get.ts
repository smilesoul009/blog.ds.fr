import { prisma } from '#server/db/client'
import { authCheck, clientCheck } from '#server/utils/checks'
import {publicArticleWhere} from "#server/utils/articleVisibility.ts";

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await clientCheck(event)

    const clientId = event.context.userId

    const links = await prisma.clientArticle.findMany({
        where: { clientId },
        select: { articleId: true, assignedAt: true, readAt: true, favoritedAt: true },
    })
    const linkByArticle = new Map(links.map(l => [l.articleId, l]))

    const assignedIds = links.filter(l => l.assignedAt).map(l => l.articleId)

    const [starters, assignedReady] = await Promise.all([
        prisma.article.findMany({
            where: { isStarter: true, ...publicArticleWhere },
            select: { id: true },
        }),
        assignedIds.length
            ? prisma.article.findMany({
                where: { id: { in: assignedIds }, ...publicArticleWhere },
                select: { id: true },
            })
            : Promise.resolve([]),
    ])

    const available = new Set([...starters, ...assignedReady].map(a => a.id))

    let unread = 0
    let favorites = 0
    for (const id of available) {
        const link = linkByArticle.get(id)
        if (!link?.readAt) unread++
        if (link?.favoritedAt) favorites++
    }

    return { unread, favorites }
})