import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('client:manage')(event)

    const query = getQuery(event) as Record<string, any>
    const page = Math.max(1, parseInt(query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20))

    const where: any = { roles: { has: 'CLIENT' }, isActive: true }

    if (query.search) {
        where.OR = [
            { username: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
        ]
    }

    if (query.mine === 'true') {
        where.clientMarks = { some: { authorId: event.context.userId } }
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
                createdAt: true,
                clientMarks: {
                    where: { authorId: event.context.userId },
                    select: { comment: true, createdAt: true },
                },
                deletionRequestedAt: true,
                _count: { select: { clientLibrary: true } },
            },
        }),
        prisma.user.count({ where }),
    ])

    const readCounts = await prisma.clientArticle.groupBy({
        by: ['clientId'],
        where: { clientId: { in: items.map(c => c.id) }, readAt: { not: null } },
        _count: { _all: true },
    })
    const readById = new Map(readCounts.map(r => [r.clientId, r._count._all]))

    return {
        items: items.map(c => ({
            ...c,
            isMine: c.clientMarks.length > 0,
            myComment: c.clientMarks[0]?.comment ?? null,
            clientMarks: undefined,
            readCount: readById.get(c.id) ?? 0,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    }
})