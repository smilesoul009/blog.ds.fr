import { prisma } from '#server/db/client'
import { authCheck, spaceAccessCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await spaceAccessCheck()(event)

    const spaceId = getRouterParam(event, 'id')!

    const items = await prisma.spaceArticle.findMany({
        where: { spaceId },
        orderBy: { position: 'asc' },
        include: {
            article: {
                select: { id: true, title: true, slug: true, status: true, updatedAt: true },
            },
        },
    })

    return items.map(i => ({ ...i.article, position: i.position, addedAt: i.addedAt }))
})