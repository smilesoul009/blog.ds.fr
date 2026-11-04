import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'
import { profileUpdateSchema } from '~~/shared/schemas/profile'
import { writeAudit } from '#server/utils/audit'

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const userId = event.context.userId
    const body = profileUpdateSchema.parse(await readBody(event))

    const taken = await prisma.user.findFirst({
        where: { email: body.email, id: { not: userId } },
        select: { id: true },
    })
    if (taken) throw createError({ statusCode: 409, message: 'Этот адрес уже используется' })

    const before = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true, username: true },
    })

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            email: body.email,
            firstName: body.firstName ?? '',
            lastName: body.lastName ?? '',
        },
        select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            roles: true,
            isActive: true,
            createdAt: true,
        },
    })

    writeAudit({
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        entityName: before?.username,
        changes: {
            email: { from: before?.email, to: updated.email },
        },
        userId,
    })

    return updated
})