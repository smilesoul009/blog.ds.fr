import bcrypt from 'bcryptjs'
import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'
import { accountDeleteSchema } from '~~/shared/schemas/profile'
import { writeAudit } from '#server/utils/audit'

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const userId = event.context.userId
    const { password } = accountDeleteSchema.parse(await readBody(event))

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true, roles: true, username: true },
    })
    if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

    if (!user.roles.includes('CLIENT')) {
        throw createError({ statusCode: 403, message: 'Удаление доступно только клиентам' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw createError({ statusCode: 403, message: 'Пароль неверный' })

    await prisma.user.update({
        where: { id: userId },
        data: {
            deletionRequestedAt: new Date(),
        },
    })

    writeAudit({
        action: 'DELETE',
        entityType: 'User',
        entityId: userId,
        entityName: user.username,
        userId,
    })

    deleteCookie(event, 'auth_token', { path: '/' })

    return { ok: true }
})