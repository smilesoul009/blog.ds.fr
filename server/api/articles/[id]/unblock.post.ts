import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'
import { writeAudit } from '#server/utils/audit'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('article:block')(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

    const article = await prisma.article.findUnique({
        where: { id },
        select: { id: true, title: true, blockedAt: true, blockReason: true, blockReply: true },
    })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })
    if (!article.blockedAt) return { ok: true }

    await prisma.article.update({
        where: { id },
        data: {
            blockedAt: null,
            blockedById: null,
            blockReason: null,
            blockReply: null,
            blockReplyAt: null,
            blockReplyById: null,
        },
    })

    // Причину и ответ сохраняем в журнале, чтобы история не потерялась
    writeAudit({
        action: 'UNBLOCK',
        entityType: 'Article',
        entityId: article.id,
        entityName: article.title,
        snapshot: { blockReason: article.blockReason, blockReply: article.blockReply },
        userId: event.context.userId,
    })

    return { ok: true }
})