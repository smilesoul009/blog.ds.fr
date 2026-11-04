import { z } from 'zod'
import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'
import { writeAudit } from '#server/utils/audit'

const bodySchema = z.object({
    reason: z.string().trim().min(1, 'Укажите причину блокировки').max(2000),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('article:block')(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

    const { reason } = bodySchema.parse(await readBody(event))
    const userId = event.context.userId

    const article = await prisma.article.findUnique({
        where: { id },
        select: { id: true, title: true, blockedAt: true, blockReason: true },
    })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

    const isNewBlock = !article.blockedAt

    await prisma.article.update({
        where: { id },
        data: {
            blockReason: reason,
            // Первая блокировка: ставим дату и автора блокировки, старый ответ стираем.
            // Повторная — только меняем причину, ответ автора сохраняется
            ...(isNewBlock && {
                blockedAt: new Date(),
                blockedById: userId,
                blockReply: null,
                blockReplyAt: null,
                blockReplyById: null,
            }),
        },
    })

    writeAudit({
        action: 'BLOCK',
        entityType: 'Article',
        entityId: article.id,
        entityName: article.title,
        changes: { blockReason: { from: article.blockReason, to: reason } },
        userId,
    })

    return { ok: true }
})