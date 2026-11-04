import { z } from 'zod'
import { BlockReviewStatus } from '@prisma/client'
import { prisma } from '#server/db/client'
import { authCheck, canReviewArticle } from '#server/utils/checks'
import { extractBlocks } from '#server/utils/articleBlocks'

const bodySchema = z.object({
    status: z.enum(BlockReviewStatus),
    comment: z.string().optional(),
}).refine(
    data => data.status !== 'REJECTED' || !!data.comment?.trim(),
    { message: 'При отклонении нужно указать причину', path: ['comment'] },
)

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await canReviewArticle()(event)

    const article = event.context.article
    const blockId = getRouterParam(event, 'blockId')
    if (!blockId) throw createError({ statusCode: 400, message: 'blockId не указан' })

    const { status, comment } = bodySchema.parse(await readBody(event))

    const block = extractBlocks(article.content).find(b => b.blockId === blockId)
    if (!block) throw createError({ statusCode: 404, message: 'Блок не найден в статье' })

    return prisma.articleBlockReview.upsert({
        where: { articleId_blockId: { articleId: article.id, blockId } },
        create: {
            articleId: article.id,
            blockId,
            status,
            comment: comment ?? null,
            contentHash: block.hash,
            reviewerId: event.context.userId,
        },
        update: {
            status,
            comment: comment ?? null,
            contentHash: block.hash,
            reviewerId: event.context.userId,
            resolvedAt: null,
            resolvedComment: null,
        },
    })
})