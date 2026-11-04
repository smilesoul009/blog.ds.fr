import {planCheck, parseBody} from '#server/utils/plan'
import {trashPurge} from '#server/utils/trash'
import {isTrashKind, trashIdsSchema} from '~~/shared/constants/trash'

// Удалить навсегда (только то, что уже в «Удалённых»; массово, один запрос)
export default defineEventHandler(async (event) => {
    await planCheck(event)
    const kind = getRouterParam(event, 'kind')
    if (!isTrashKind(kind)) throw createError({statusCode: 404, message: 'Неизвестный вид'})

    const {ids} = parseBody(trashIdsSchema, await readBody(event))
    return {count: await trashPurge(event, kind, ids)}
})
