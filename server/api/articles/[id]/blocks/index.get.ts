import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'
import { extractBlocks } from '#server/utils/articleBlocks'

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

    const article = await prisma.article.findUnique({
        where: { id },
        select: { id: true, content: true, status: true },
    })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

    const blocks = extractBlocks(article.content)
    const reviews = await prisma.articleBlockReview.findMany({
        where: { articleId: id },
        include: { reviewer: { select: { id: true, firstName: true, lastName: true } } },
    })
    const byId = new Map(reviews.map(r => [r.blockId, r]))

    const items = blocks.map(({ blockId, hash }) => {
        const review = byId.get(blockId)

        if (!review) {
            return { blockId, state: 'pending' as const, review: null }
        }

        const stale = review.contentHash !== hash

        return {
            blockId,
            state: stale
                ? ('stale' as const)
                : review.status === 'APPROVED'
                    ? ('approved' as const)
                    : ('rejected' as const),
            review: {
                id: review.id,
                status: review.status,
                comment: review.comment,
                resolvedAt: review.resolvedAt,
                resolvedComment: review.resolvedComment,
                reviewer: review.reviewer,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
            },
        }
    })

    return {
        total: items.length,
        approved: items.filter(i => i.state === 'approved').length,
        pending: items.filter(i => i.state !== 'approved').length,
        items,
    }
})