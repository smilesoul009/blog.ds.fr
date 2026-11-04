import { prisma } from '#server/db/client'
import { authCheck, spaceAccessCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await spaceAccessCheck()(event)

    return prisma.spaceAccessLink.findMany({
        where: { spaceId: getRouterParam(event, 'id')! },
        orderBy: { createdAt: 'desc' },
    })
})