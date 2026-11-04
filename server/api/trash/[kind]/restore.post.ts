import {planCheck, parseBody} from '#server/utils/plan'
import {trashRestore} from '#server/utils/trash'
import {isTrashKind, trashIdsSchema} from '~~/shared/constants/trash'

// Вернуть из «Удалённых» (массово, один запрос)
export default defineEventHandler(async (event) => {
    await planCheck(event)
    const kind = getRouterParam(event, 'kind')
    if (!isTrashKind(kind)) throw createError({statusCode: 404, message: 'Неизвестный вид'})

    const {ids} = parseBody(trashIdsSchema, await readBody(event))
    return {count: await trashRestore(event, kind, ids)}
})
