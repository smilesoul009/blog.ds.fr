import {prisma} from '#server/db/client'
import {notificationsCheck} from '#server/utils/notifications'
import {permissionCheck} from '#server/utils/checks'
import {parseBody} from '#server/utils/plan'
import {mergeNotifySettings, notifySettingsSchema} from '~~/shared/constants/notifications'

export default defineEventHandler(async (event) => {
    await notificationsCheck(event)
    await permissionCheck('plan:use')(event)

    const settings = parseBody(notifySettingsSchema, await readBody(event))
    await prisma.user.update({
        where: {id: event.context.userId},
        data: {notifySettings: settings},
        select: {id: true},
    })
    return {settings: mergeNotifySettings(settings)}
})
