import {prisma} from '#server/db/client'
import {notificationsCheck, notificationSelect} from '#server/utils/notifications'

// Уведомления пользователя: последние 10 уже показанных и число непрочитанных
export default defineEventHandler(async (event) => {
    await notificationsCheck(event)

    // В режиме «просмотр как» чужие уведомления не показываем
    if (event.context.realUserId) return {items: [], unread: 0}

    const userId = event.context.userId
    const now = new Date()
    const [items, unread] = await Promise.all([
        prisma.notification.findMany({
            where: {userId, showAt: {lte: now}},
            orderBy: {showAt: 'desc'},
            take: 10,
            select: notificationSelect,
        }),
        prisma.notification.count({where: {userId, readAt: null, showAt: {lte: now}}}),
    ])

    return {items, unread}
})
