import {purgeOldNotifications} from '#server/utils/notifications'

export default defineTask({
    meta: {
        name: 'notifications:purge',
        description: 'Удаление прочитанных уведомлений старше 30 дней',
    },
    async run() {
        const removed = await purgeOldNotifications()
        if (removed) console.log(`[notifications:purge] удалено: ${removed}`)
        return {result: {removed}}
    },
})
