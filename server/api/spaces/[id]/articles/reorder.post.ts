import { z } from 'zod'
import { prisma } from '#server/db/client'
import { authCheck, spaceAccessCheck } from '#server/utils/checks'

const bodySchema = z.object({
    articleIds: z.array(z.string().min(1)),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await spaceAccessCheck()(event)

    const spaceId = getRouterParam(event, 'id')!
    const { articleIds } = bodySchema.parse(await readBody(event))

    await prisma.$transaction(
        articleIds.map((articleId, index) =>
            prisma.spaceArticle.updateMany({
                where: { spaceId, articleId },
                data: { position: index },
            }),
        ),
    )

    return { ok: true }
})