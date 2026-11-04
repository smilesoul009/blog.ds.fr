import {prisma} from '#server/db/client'
import {notificationsCheck, DEFAULT_TIMEZONE} from '#server/utils/notifications'
import {permissionCheck} from '#server/utils/checks'
import {DEFAULT_NOTIFY_SETTINGS, mergeNotifySettings} from '~~/shared/constants/notifications'

export default defineEventHandler(async (event) => {
    await notificationsCheck(event)
    await permissionCheck('plan:use')(event)

    const user = await prisma.user.findUnique({
        where: {id: event.context.userId},
        select: {timezone: true, notifySettings: true},
    })
    if (!user) throw createError({statusCode: 404, message: 'Пользователь не найден'})

    return {
        timezone: user.timezone,
        defaultTimezone: DEFAULT_TIMEZONE,
        settings: mergeNotifySettings(user.notifySettings),
        defaults: DEFAULT_NOTIFY_SETTINGS,
    }
})
