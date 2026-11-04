import { prisma } from '#server/db/client'
import { authCheck, canReviewArticle } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await canReviewArticle()(event)

    const articleId = getRouterParam(event, 'id')!
    const blockId = getRouterParam(event, 'blockId')
    if (!blockId) throw createError({ statusCode: 400, message: 'blockId не указан' })

    await prisma.articleBlockReview.deleteMany({
        where: { articleId, blockId },
    })

    return { ok: true }
})