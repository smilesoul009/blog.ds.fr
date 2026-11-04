import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'
import { writeAudit } from '#server/utils/audit'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('user:manage')(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

    const client = await prisma.user.findFirst({
        where: { id, roles: { has: 'CLIENT' } },
        select: { id: true, username: true, email: true, firstName: true, lastName: true },
    })
    if (!client) throw createError({ statusCode: 404, message: 'Клиент не найден' })

    await prisma.$transaction([
        prisma.clientArticle.deleteMany({ where: { clientId: id } }),
        prisma.user.update({
            where: { id },
            data: {
                email: `deleted-${id}@local`,
                firstName: '',
                lastName: '',
                passwordHash: '',
                isActive: false,
                deletedAt: new Date(),
                deletionRequestedAt: null,
            },
        }),
    ])

    writeAudit({
        action: 'DELETE',
        entityType: 'User',
        entityId: id,
        entityName: client.username,
        snapshot: client,
        userId: event.context.userId,
    })

    return { ok: true }
})