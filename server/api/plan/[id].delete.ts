import {planCheck} from '#server/utils/plan'
import {softDelete} from '#server/utils/trash'

// Удаление — в «Удалённые» (признак deletedAt); восстановить или удалить навсегда — /api/trash/tasks
export default defineEventHandler(async (event) => {
    await planCheck(event)
    const count = await softDelete(event, 'tasks', [getRouterParam(event, 'id')!])
    if (!count) throw createError({statusCode: 404, message: 'Задача не найдена'})
    return {ok: true}
})
