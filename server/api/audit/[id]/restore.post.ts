import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'
import { writeAudit } from '#server/utils/audit'

const RESTORABLE: Record<string, string> = {
    Area: 'area',
    Space: 'space',
    User: 'user',
}

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('audit:restore')(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

    const entry = await prisma.auditLog.findUnique({ where: { id } })
    if (!entry) throw createError({ statusCode: 404, message: 'Запись журнала не найдена' })

    if (entry.action !== 'DELETE' || !entry.snapshot) {
        throw createError({ statusCode: 409, message: 'Эта запись не подлежит восстановлению' })
    }

    const delegateName = RESTORABLE[entry.entityType]
    if (!delegateName) {
        throw createError({ statusCode: 409, message: 'Восстановление для этого типа не поддерживается' })
    }

    const delegate = (prisma as any)[delegateName]

    const existing = await delegate.findUnique({ where: { id: entry.entityId } })
    if (existing) {
        throw createError({ statusCode: 409, message: 'Объект уже существует' })
    }

    const data = { ...(entry.snapshot as any) }

    if (entry.entityType === 'User') {
        data.passwordHash = ''
        data.isActive = false
    }

    const restored = await delegate.create({ data })

    writeAudit({
        action: 'RESTORE',
        entityType: entry.entityType,
        entityId: restored.id,
        entityName: entry.entityName,
        userId: event.context.userId,
    })

    return restored
})