import { purgeExpiredAccounts } from '#server/utils/purgeAccounts'

export default defineTask({
    meta: {
        name: 'accounts:purge',
        description: 'Удаление аккаунтов через 30 дней после запроса',
    },
    async run() {
        const result = await purgeExpiredAccounts()
        if (result.purged) {
            console.log(`[accounts:purge] удалено аккаунтов: ${result.purged}`)
        }
        return { result }
    },
})