import { prisma } from '#server/db/client'
import { accessLinkCheck } from '#server/utils/checks'
import { renderArticleHtml } from '#server/utils/renderArticle'
import {publicArticleWhere} from "#server/utils/articleVisibility.ts";

export default defineEventHandler(async (event) => {
    await accessLinkCheck(event)

    const link = event.context.accessLink
    const slug = getRouterParam(event, 'slug')
    if (!slug) throw createError({ statusCode: 400, message: 'slug не указан' })

    const article = await prisma.article.findFirst({
        where: {
            slug,
            ...publicArticleWhere,
            OR: [
                { spaces: { some: { spaceId: link.spaceId } } },
                { isStarter: true },
            ],
        },
        select: { title: true, slug: true, content: true, publishedAt: true },
    })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

    return {
        title: article.title,
        slug: article.slug,
        html: renderArticleHtml(article.content),
        publishedAt: article.publishedAt,
    }
})