import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('client:manage')(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

    const client = await prisma.user.findFirst({
        where: { id, roles: { has: 'CLIENT' } },
        select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            clientMarks: {
                select: {
                    comment: true,
                    createdAt: true,
                    author: { select: { id: true, firstName: true, lastName: true, username: true } },
                },
            },
            clientLibrary: {
                where: { assignedAt: { not: null } },
                orderBy: { assignedAt: 'desc' },
                select: {
                    comment: true,
                    assignedAt: true,
                    readAt: true,
                    favoritedAt: true,
                    article: {
                        select: { id: true, title: true, slug: true, area: { select: { name: true } } },
                    },
                    assignedBy: { select: { id: true, firstName: true, lastName: true } },
                },
            },
        },
    })

    if (!client) throw createError({ statusCode: 404, message: 'Клиент не найден' })

    return client
})