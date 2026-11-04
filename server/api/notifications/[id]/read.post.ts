import {prisma} from '#server/db/client'
import {notificationsCheck} from '#server/utils/notifications'

export default defineEventHandler(async (event) => {
    await notificationsCheck(event)

    const id = getRouterParam(event, 'id')!
    await prisma.notification.updateMany({
        where: {id, userId: event.context.userId, readAt: null},
        data: {readAt: new Date()},
    })
    return {ok: true}
})
