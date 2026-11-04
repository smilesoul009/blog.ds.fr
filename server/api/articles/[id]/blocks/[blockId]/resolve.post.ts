import { z } from 'zod'
import { prisma } from '#server/db/client'
import { authCheck, canEditArticle } from '#server/utils/checks'

const bodySchema = z.object({
    comment: z.string().optional(),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await canEditArticle()(event)

    const articleId = getRouterParam(event, 'id')!
    const blockId = getRouterParam(event, 'blockId')
    if (!blockId) throw createError({ statusCode: 400, message: 'blockId не указан' })

    const { comment } = bodySchema.parse(await readBody(event))

    const review = await prisma.articleBlockReview.findUnique({
        where: { articleId_blockId: { articleId, blockId } },
    })
    if (!review) throw createError({ statusCode: 404, message: 'Замечание не найдено' })

    if (review.status !== 'REJECTED') {
        throw createError({ statusCode: 409, message: 'Отмечать можно только отклонённые блоки' })
    }

    return prisma.articleBlockReview.update({
        where: { id: review.id },
        data: {
            resolvedAt: new Date(),
            resolvedComment: comment ?? null,
        },
    })
})