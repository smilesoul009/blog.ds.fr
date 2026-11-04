import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('article:markStarter')(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

    const article = await prisma.article.findUnique({
        where: { id },
        select: { id: true, isStarter: true, status: true },
    })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

    if (!article.isStarter && article.status !== 'READY') {
        throw createError({
            statusCode: 409,
            message: 'В набор для ознакомления можно добавить только готовую статью',
        })
    }

    const updated = await prisma.article.update({
        where: { id },
        data: { isStarter: !article.isStarter },
        select: { isStarter: true },
    })

    return updated
})