import {z} from 'zod'
import {prisma} from '#server/db/client'
import {notificationsCheck} from '#server/utils/notifications'
import {parseBody} from '#server/utils/plan'

const schema = z.object({
    ids: z.array(z.string()).min(1).max(1000),
    action: z.enum(['read', 'unread', 'delete']),
})

// Действия с несколькими уведомлениями: прочитано, непрочитано, удалить. Только свои
export default defineEventHandler(async (event) => {
    await notificationsCheck(event)

    const {ids, action} = parseBody(schema, await readBody(event))
    const where = {id: {in: ids}, userId: event.context.userId}

    const result = action === 'delete'
        ? await prisma.notification.deleteMany({where})
        : await prisma.notification.updateMany({where, data: {readAt: action === 'read' ? new Date() : null}})

    return {count: result.count}
})
