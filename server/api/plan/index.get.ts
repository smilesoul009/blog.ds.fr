import {prisma} from '#server/db/client'
import {planCheck, isoToDate, planTaskSelect, toPlanItem} from '#server/utils/plan'
import {isPlanScope, isValidPeriodKey, periodStartISO, SCOPE_ENUM} from '~~/shared/utils/planDates'

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const {scope, period} = getQuery(event) as { scope?: string; period?: string }
    if (!isPlanScope(scope) || !period || !isValidPeriodKey(scope, period)) {
        throw createError({statusCode: 400, message: 'Неверный период'})
    }

    const items = await prisma.planTask.findMany({
        where: {
            userId: event.context.userId,
            scope: SCOPE_ENUM[scope],
            periodStart: isoToDate(periodStartISO(scope, period)),
            // Перенос убран (2.0): перенесённые раньше задачи не показываем — в новом периоде у них есть копия
            movedAt: null,
        },
        orderBy: scope === 'week'
            ? [{day: 'asc'}, {startMin: 'asc'}, {position: 'asc'}]
            : [{position: 'asc'}, {createdAt: 'asc'}],
        select: planTaskSelect,
    })

    return {items: items.map(toPlanItem)}
})