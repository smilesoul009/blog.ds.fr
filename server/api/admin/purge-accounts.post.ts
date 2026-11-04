import { authCheck, permissionCheck } from '#server/utils/checks'
import { purgeExpiredAccounts } from '#server/utils/purgeAccounts'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('user:manage')(event)

    return purgeExpiredAccounts()
})