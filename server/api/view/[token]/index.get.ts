import { prisma } from '#server/db/client'
import { accessLinkCheck } from '#server/utils/checks'
import { readerArticleSelect, toReaderItem } from '#server/utils/articlePreview'
import {publicArticleWhere} from "#server/utils/articleVisibility.ts";

export default defineEventHandler(async (event) => {
    await accessLinkCheck(event)
    const link = event.context.accessLink

    const spaceItems = await prisma.spaceArticle.findMany({
        where: { spaceId: link.spaceId, article: { ...publicArticleWhere } },
        orderBy: { position: 'asc' },
        select: { article: { select: readerArticleSelect } },
    })

    const starters = await prisma.article.findMany({
        where: {
            isStarter: true,
            status: 'READY',
            NOT: { spaces: { some: { spaceId: link.spaceId } } },
        },
        orderBy: { publishedAt: 'desc' },
        select: readerArticleSelect,
    })

    if (!getCookie(event, 'view_as')) {
        prisma.spaceAccessLink
            .update({
                where: { id: link.id },
                data: { viewCount: { increment: 1 }, lastSeenAt: new Date() },
            })
            .catch(() => {})
    }

    return {
        space: link.space,
        articles: [...starters, ...spaceItems.map(i => i.article)].map(toReaderItem),
    }
})