import {purgeOldTrash, warnTrashPurge} from '#server/utils/trash'

export default defineTask({
    meta: {
        name: 'trash:purge',
        description: '«Удалённые»: удалить навсегда то, что лежит дольше 30 дней, и предупредить за 3 дня',
    },
    async run() {
        const warned = await warnTrashPurge()
        const purged = await purgeOldTrash()
        if (warned || purged) console.log(`[trash:purge] предупреждений: ${warned}, удалено навсегда: ${purged}`)
        return {result: {warned, purged}}
    },
})
