import { prisma } from '#server/db/client'
import { authCheck, clientCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await clientCheck(event)

    const clientId = event.context.userId
    const articleId = getRouterParam(event, 'id')
    if (!articleId) throw createError({ statusCode: 400, message: 'ID не указан' })

    const link = await prisma.clientArticle.findUnique({
        where: { clientId_articleId: { clientId, articleId } },
    })

    const nextValue = link?.favoritedAt ? null : new Date()

    await prisma.clientArticle.upsert({
        where: { clientId_articleId: { clientId, articleId } },
        create: { clientId, articleId, favoritedAt: nextValue },
        update: { favoritedAt: nextValue },
    })

    return { isFavorite: !!nextValue }
})