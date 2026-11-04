import { prisma } from '#server/db/client'
import { authCheck, spaceAccessCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await spaceAccessCheck()(event)

    const spaceId = getRouterParam(event, 'id')!
    const linkId = getRouterParam(event, 'linkId')
    if (!linkId) throw createError({ statusCode: 400, message: 'linkId не указан' })

    const link = await prisma.spaceAccessLink.findFirst({ where: { id: linkId, spaceId } })
    if (!link) throw createError({ statusCode: 404, message: 'Ссылка не найдена' })

    return prisma.spaceAccessLink.update({
        where: { id: linkId },
        data: { revokedAt: new Date() },
    })
})