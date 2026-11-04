import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'
import { signViewAs } from '#server/utils/jwt'
import { writeAudit } from '#server/utils/audit'

export default defineEventHandler(async (event) => {
    await authCheck(event)   // в режиме просмотра сюда не попасть: POST там запрещён
    await permissionCheck('user:viewAs')(event)

    const adminId = event.context.userId
    const targetId = getRouterParam(event, 'id')
    if (!targetId) throw createError({ statusCode: 400, message: 'ID не указан' })
    if (targetId === adminId) throw createError({ statusCode: 400, message: 'Это вы' })

    const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true, username: true, firstName: true, lastName: true, roles: true },
    })
    if (!target) throw createError({ statusCode: 404, message: 'Пользователь не найден' })
    if (target.roles.includes('ADMIN')) {
        throw createError({ statusCode: 403, message: 'Нельзя смотреть сайт от имени администратора' })
    }

    setCookie(event, 'view_as', signViewAs({ adminId, targetId }), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60,
    })

    writeAudit({
        action: 'VIEW_AS',
        entityType: 'User',
        entityId: target.id,
        entityName: [target.firstName, target.lastName].filter(Boolean).join(' ') || target.username,
        userId: adminId,
    })

    return { isClient: target.roles.includes('CLIENT') }
})