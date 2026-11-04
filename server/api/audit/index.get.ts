import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('audit:view')(event)

    const query = getQuery(event) as Record<string, any>
    const page = Math.max(1, parseInt(query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 30))

    const where: any = {}
    if (query.action) where.action = query.action
    if (query.entityType) where.entityType = query.entityType
    if (query.entityId) where.entityId = query.entityId

    const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, firstName: true, lastName: true, username: true } } },
        }),
        prisma.auditLog.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
})