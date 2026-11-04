import {prisma} from '#server/db/client'
import {notificationsCheck} from '#server/utils/notifications'
import {isValidTimeZone} from '~~/shared/constants/notifications'

// Браузер сообщает свой часовой пояс; сохраняем, только если он изменился
export default defineEventHandler(async (event) => {
    await notificationsCheck(event)

    const {timezone} = (await readBody(event)) ?? {}
    if (!isValidTimeZone(timezone)) throw createError({statusCode: 400, message: 'Неверный часовой пояс'})

    await prisma.user.updateMany({
        where: {id: event.context.userId, OR: [{timezone: null}, {timezone: {not: timezone}}]},
        data: {timezone},
    })
    return {timezone}
})
