import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const areaId = getRouterParam(event, 'id')
    if (!areaId) throw createError({ statusCode: 400, message: 'ID не указан' })

    const area = await prisma.area.findUnique({
        where: { id: areaId },
        select: { ownerId: true },
    })
    if (!area) throw createError({ statusCode: 404, message: 'Направление не найдено' })

    const items = await prisma.userArea.findMany({
        where: { areaId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    roles: true,
                    isActive: true,
                },
            },
        },
    })

    return items.map(i => ({
        ...i.user,
        isOwner: i.user.id === area.ownerId,
    }))
})