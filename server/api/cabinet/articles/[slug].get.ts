import {prisma} from '#server/db/client'
import {authCheck, clientCheck} from '#server/utils/checks'
import {renderArticleHtml} from '#server/utils/renderArticle'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await clientCheck(event)

    const clientId = event.context.userId
    const slug = getRouterParam(event, 'slug')
    if (!slug) throw createError({statusCode: 400, message: 'slug не указан'})

    const article = await prisma.article.findFirst({
        where: {slug, status: 'READY'},
        select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            isStarter: true,
            publishedAt: true,
        },
    })
    if (!article) throw createError({statusCode: 404, message: 'Статья не найдена'})

    const link = await prisma.clientArticle.findUnique({
        where: {clientId_articleId: {clientId, articleId: article.id}},
        include: {assignedBy: {select: {firstName: true, lastName: true}}},
    })

    const available = article.isStarter || !!link?.assignedAt
    if (!available) throw createError({statusCode: 403, message: 'Статья недоступна'})

    if (!event.context.readOnly) {
        await prisma.clientArticle.upsert({
            where: { clientId_articleId: { clientId, articleId: article.id } },
            create: { clientId, articleId: article.id, readAt: new Date() },
            update: { readAt: link?.readAt ?? new Date() },
        })
    }

    return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        html: renderArticleHtml(article.content),
        publishedAt: article.publishedAt,
        isFavorite: !!link?.favoritedAt,
        comment: link?.assignedAt && link.comment
            ? {
                text: link.comment,
                author: [link.assignedBy?.firstName, link.assignedBy?.lastName].filter(Boolean).join(' '),
                date: link.assignedAt,
            }
            : null,
    }
})