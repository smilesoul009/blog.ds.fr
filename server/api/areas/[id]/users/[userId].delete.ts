import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('area:manage')(event)

    const areaId = getRouterParam(event, 'id')!
    const userId = getRouterParam(event, 'userId')
    if (!userId) throw createError({ statusCode: 400, message: 'userId не указан' })

    const area = await prisma.area.findUnique({
        where: { id: areaId },
        select: { ownerId: true },
    })

    if (area?.ownerId === userId) {
        throw createError({
            statusCode: 409,
            message: 'Нельзя убрать владельца направления. Сначала снимите с него владение.',
        })
    }

    const hasArticles = await prisma.article.count({
        where: {
            areaId,
            status: { not: 'ARCHIVED' },
            authors: { some: { userId } },
        },
    })

    if (hasArticles > 0) {
        throw createError({
            statusCode: 409,
            message: `Нельзя убрать: у пользователя ${hasArticles} активных статей в этом направлении`,
        })
    }

    await prisma.userArea.deleteMany({ where: { areaId, userId } })
    return { ok: true }
})