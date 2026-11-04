import {prisma} from '#server/db/client'
import {planCheck, parseBody, isoToDate} from '#server/utils/plan'
import {planReorderSchema} from '~~/shared/schemas/plan'
import {isValidPeriodKey, periodStartISO, SCOPE_ENUM} from '~~/shared/utils/planDates'

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const body = parseBody(planReorderSchema, await readBody(event))
    if (!isValidPeriodKey(body.scope, body.period)) {
        throw createError({statusCode: 400, message: 'Неверный период'})
    }

    const existing = await prisma.planTask.findMany({
        where: {
            userId: event.context.userId,
            scope: SCOPE_ENUM[body.scope],
            periodStart: isoToDate(periodStartISO(body.scope, body.period)),
            ...(body.scope === 'week' ? {day: null} : {}),
            movedAt: null,
        },
        select: {id: true},
    })

    const known = new Set(existing.map(t => t.id))
    const same = body.ids.length === known.size
        && new Set(body.ids).size === body.ids.length
        && body.ids.every(id => known.has(id))
    if (!same) {
        throw createError({statusCode: 409, message: 'Список изменился, обновите страницу'})
    }

    await prisma.$transaction(
        body.ids.map((id, position) => prisma.planTask.update({
            where: {id},
            data: body.moved?.id === id ? {position, status: body.moved.status} : {position},
        })),
    )

    return {ok: true}
})