import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('user:manage')(event)

    const query = getQuery(event) as Record<string, any>
    const page = Math.max(1, parseInt(query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20))

    const where: any = { roles: { has: 'CLIENT' }, deletedAt: null }

    if (query.isActive === undefined) {
        where.isActive = true
    } else {
        where.isActive = query.isActive !== 'false'
    }

    if (query.search) {
        where.OR = [
            { username: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
        ]
    }

    const [items, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                createdAt: true,
                deletionRequestedAt: true,
                _count: { select: { clientLibrary: true, clientMarks: true } },
            },
        }),
        prisma.user.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
})