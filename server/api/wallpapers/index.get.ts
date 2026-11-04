import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('wallpaper:manage')(event)

    const query = getQuery(event) as Record<string, any>

    const where: any = {}
    if (query.device) where.device = query.device

    return prisma.wallpaper.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            assignments: { select: { slot: true, position: true } },
            uploadedBy: { select: { id: true, firstName: true, lastName: true, username: true } },
        },
    })
})