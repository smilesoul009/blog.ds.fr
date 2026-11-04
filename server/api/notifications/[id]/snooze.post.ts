import {prisma} from '#server/db/client'
import {notificationsCheck} from '#server/utils/notifications'

const SNOOZE_MIN = 10

// «Отложить»: уведомление пропадает и появляется снова через 10 минут
export default defineEventHandler(async (event) => {
    await notificationsCheck(event)

    const id = getRouterParam(event, 'id')!
    const showAt = new Date(Date.now() + SNOOZE_MIN * 60 * 1000)
    const result = await prisma.notification.updateMany({
        where: {id, userId: event.context.userId},
        data: {showAt, readAt: null},
    })
    if (!result.count) throw createError({statusCode: 404, message: 'Уведомление не найдено'})
    return {showAt}
})
