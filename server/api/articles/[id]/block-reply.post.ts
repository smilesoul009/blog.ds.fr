import { z } from 'zod'
import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'

const bodySchema = z.object({
    text: z.string().trim().min(1, 'Напишите ответ').max(2000),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

    const { text } = bodySchema.parse(await readBody(event))
    const userId = event.context.userId
    const user = event.context.user

    const article = await prisma.article.findUnique({
        where: { id },
        select: {
            id: true,
            blockedAt: true,
            authors: { select: { userId: true } },
            area: { select: { ownerId: true } },
        },
    })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })
    if (!article.blockedAt) throw createError({ statusCode: 409, message: 'Статья не заблокирована' })

    const canReply =
        article.authors.some(a => a.userId === userId) ||
        article.area.ownerId === userId
    if (!canReply) throw createError({ statusCode: 403, message: 'Ответить может только автор статьи или владелец направления' })

    await prisma.article.update({
        where: { id },
        data: { blockReply: text, blockReplyAt: new Date(), blockReplyById: userId },
    })

    return { ok: true }
})