import {prisma} from '#server/db/client'
import {notificationsCheck, notificationSelect} from '#server/utils/notifications'

const PAGE = 30

// Страница «Уведомления»: фильтры, поиск, подгрузка по 30
export default defineEventHandler(async (event) => {
    await notificationsCheck(event)
    if (event.context.realUserId) return {items: [], nextCursor: null, total: 0, unread: 0}

    const userId = event.context.userId
    const query = getQuery(event) as { filter?: string; type?: string; q?: string; cursor?: string }
    const q = String(query.q ?? '').trim().slice(0, 100)
    const now = new Date()

    const base = {userId, showAt: {lte: now}}
    const where = {
        ...base,
        ...(query.filter === 'unread' ? {readAt: null} : {}),
        ...(query.type ? {type: String(query.type)} : {}),
        ...(q ? {OR: [{title: {contains: q, mode: 'insensitive' as const}}, {body: {contains: q, mode: 'insensitive' as const}}]} : {}),
    }

    const [rows, total, unread] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: [{showAt: 'desc'}, {id: 'desc'}],
            take: PAGE + 1,
            ...(query.cursor ? {cursor: {id: String(query.cursor)}, skip: 1} : {}),
            select: notificationSelect,
        }),
        prisma.notification.count({where: base}),
        prisma.notification.count({where: {...base, readAt: null}}),
    ])

    const items = rows.slice(0, PAGE)
    return {items, nextCursor: rows.length > PAGE ? items[items.length - 1]!.id : null, total, unread}
})
