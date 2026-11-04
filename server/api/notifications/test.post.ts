import {prisma} from '#server/db/client'
import {notificationsCheck} from '#server/utils/notifications'

// Тестовое уведомление самому себе — для проверки колокольчика из настроек
export default defineEventHandler(async (event) => {
    await notificationsCheck(event)

    await prisma.notification.create({
        data: {
            userId: event.context.userId,
            type: 'test',
            title: 'Проверка уведомлений',
            body: 'Если вы это видите, уведомления работают.',
            link: '/settings/notifications',
        },
    })
    return {ok: true}
})
