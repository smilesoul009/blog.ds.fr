import { prisma } from '#server/db/client'
import { authCheck, spaceAccessCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await spaceAccessCheck()(event)

    const spaceId = getRouterParam(event, 'id')!
    const articleId = getRouterParam(event, 'articleId')
    if (!articleId) throw createError({ statusCode: 400, message: 'articleId не указан' })

    await prisma.spaceArticle.deleteMany({ where: { spaceId, articleId } })
    return { ok: true }
})