import {planCheck} from '#server/utils/plan'
import {softDelete} from '#server/utils/trash'

// Удаление цели — в «Удалённые»; этапы уходят и возвращаются вместе с ней
export default defineEventHandler(async (event) => {
    await planCheck(event)
    const count = await softDelete(event, 'goals', [getRouterParam(event, 'id')!])
    if (!count) throw createError({statusCode: 404, message: 'Цель не найдена'})
    return {ok: true}
})
