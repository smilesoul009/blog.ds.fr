import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const user = await prisma.user.findUnique({
        where: { id: event.context.userId },
        select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            roles: true,
            createdAt: true,
            deletionRequestedAt: true,
        },
    })
    if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

    return user
})