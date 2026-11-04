import { z } from 'zod'
import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

const bodySchema = z.object({
    articleId: z.string().min(1),
    comment: z.string().optional(),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('client:manage')(event)

    const clientId = getRouterParam(event, 'id')
    if (!clientId) throw createError({ statusCode: 400, message: 'ID не указан' })

    const { articleId, comment } = bodySchema.parse(await readBody(event))

    const [client, article] = await Promise.all([
        prisma.user.findFirst({ where: { id: clientId, roles: { has: 'CLIENT' } }, select: { id: true } }),
        prisma.article.findUnique({ where: { id: articleId }, select: { id: true, status: true } }),
    ])

    if (!client) throw createError({ statusCode: 404, message: 'Клиент не найден' })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })
    if (article.status !== 'READY') {
        throw createError({ statusCode: 409, message: 'Можно назначать только готовые статьи' })
    }

    return prisma.clientArticle.upsert({
        where: { clientId_articleId: { clientId, articleId } },
        create: {
            clientId,
            articleId,
            assignedAt: new Date(),
            assignedById: event.context.userId,
            comment: comment ?? null,
        },
        update: {
            assignedAt: new Date(),
            assignedById: event.context.userId,
            comment: comment ?? null,
        },
    })
})