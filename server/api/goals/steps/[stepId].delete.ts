import {planCheck} from '#server/utils/plan'
import {softDelete} from '#server/utils/trash'

// Удаление этапа — в «Удалённые» своей цели
export default defineEventHandler(async (event) => {
    await planCheck(event)
    const count = await softDelete(event, 'steps', [getRouterParam(event, 'stepId')!])
    if (!count) throw createError({statusCode: 404, message: 'Этап не найден'})
    return {ok: true}
})
