import { z } from 'zod'
import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'
import { writeAudit } from '#server/utils/audit'

const bodySchema = z.object({
    userId: z.string().min(1).nullable(),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('area:manage')(event)

    const areaId = getRouterParam(event, 'id')
    if (!areaId) throw createError({ statusCode: 400, message: 'ID не указан' })

    const { userId } = bodySchema.parse(await readBody(event))

    const area = await prisma.area.findUnique({
        where: { id: areaId },
        select: { id: true, name: true, ownerId: true },
    })
    if (!area) throw createError({ statusCode: 404, message: 'Направление не найдено' })

    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        })
        if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

        await prisma.userArea.upsert({
            where: { userId_areaId: { userId, areaId } },
            create: { userId, areaId },
            update: {},
        })
    }

    const updated = await prisma.area.update({
        where: { id: areaId },
        data: { ownerId: userId },
    })

    writeAudit({
        action: 'UPDATE',
        entityType: 'Area',
        entityId: areaId,
        entityName: area.name,
        changes: { ownerId: { from: area.ownerId, to: userId } },
        userId: event.context.userId,
    })

    return updated
})