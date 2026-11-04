import { z } from 'zod'
import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

const bodySchema = z.object({
    userId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('area:manage')(event)

    const areaId = getRouterParam(event, 'id')!
    const { userId } = bodySchema.parse(await readBody(event))

    const [area, user] = await Promise.all([
        prisma.area.findUnique({ where: { id: areaId }, select: { id: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    ])

    if (!area) throw createError({ statusCode: 404, message: 'Направление не найдено' })
    if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

    await prisma.userArea.upsert({
        where: { userId_areaId: { userId, areaId } },
        create: { userId, areaId },
        update: {},
    })

    return { ok: true }
})