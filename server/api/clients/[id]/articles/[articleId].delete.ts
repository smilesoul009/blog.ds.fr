import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('client:manage')(event)

    const clientId = getRouterParam(event, 'id')!
    const articleId = getRouterParam(event, 'articleId')
    if (!articleId) throw createError({ statusCode: 400, message: 'ID статьи не указан' })

    const link = await prisma.clientArticle.findUnique({
        where: { clientId_articleId: { clientId, articleId } },
    })
    if (!link) return { ok: true }

    if (link.favoritedAt || link.readAt) {
        await prisma.clientArticle.update({
            where: { clientId_articleId: { clientId, articleId } },
            data: { assignedAt: null, assignedById: null, comment: null },
        })
    } else {
        await prisma.clientArticle.delete({
            where: { clientId_articleId: { clientId, articleId } },
        })
    }

    return { ok: true }
})