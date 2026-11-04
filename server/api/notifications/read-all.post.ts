import {prisma} from '#server/db/client'
import {notificationsCheck} from '#server/utils/notifications'

export default defineEventHandler(async (event) => {
    await notificationsCheck(event)

    const result = await prisma.notification.updateMany({
        where: {userId: event.context.userId, readAt: null, showAt: {lte: new Date()}},
        data: {readAt: new Date()},
    })
    return {count: result.count}
})
