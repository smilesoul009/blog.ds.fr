import {planCheck} from '#server/utils/plan'
import {trashCount, trashList} from '#server/utils/trash'
import {isTrashKind} from '~~/shared/constants/trash'

// «Удалённые» вида kind: список или только число (?count=1). Для этапов — ?goalId= (этапы одной цели)
export default defineEventHandler(async (event) => {
    await planCheck(event)
    const kind = getRouterParam(event, 'kind')
    if (!isTrashKind(kind)) throw createError({statusCode: 404, message: 'Неизвестный вид'})

    const query = getQuery(event)
    const q = {goalId: typeof query.goalId === 'string' && query.goalId ? query.goalId : undefined}
    if (query.count === '1') return {count: await trashCount(event, kind, q)}
    return {items: await trashList(event, kind, q)}
})
