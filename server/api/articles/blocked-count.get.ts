import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'
import { hasPermission } from '~~/shared/constants/permissions'

// Сколько статей заблокировано — для пункта меню администратора
export default defineEventHandler(async (event) => {
    await authCheck(event)
    if (!hasPermission(event.context.user.roles, 'article:block')) return { count: 0 }

    const count = await prisma.article.count({ where: { blockedAt: { not: null } } })
    return { count }
})