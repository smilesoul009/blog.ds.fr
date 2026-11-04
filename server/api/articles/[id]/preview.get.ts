import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'
import { renderArticleHtml } from '#server/utils/renderArticle'

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

    const article = await prisma.article.findUnique({
        where: { id },
        select: { content: true },
    })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

    return { html: renderArticleHtml(article.content) }
})