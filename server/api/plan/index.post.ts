import {prisma} from '#server/db/client'
import {planCheck, parseBody, isoToDate, planTaskSelect, toPlanItem, normalizeWeekFields} from '#server/utils/plan'
import {placeWeekTask} from '#server/utils/planWeek'
import {planCreateSchema} from '~~/shared/schemas/plan'
import {isValidPeriodKey, periodStartISO, SCOPE_ENUM} from '~~/shared/utils/planDates'
import {PLAN_SLOT_MIN, slotOf} from '~~/shared/utils/planWeek'

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const body = parseBody(planCreateSchema, await readBody(event))
    if (!isValidPeriodKey(body.scope, body.period)) {
        throw createError({statusCode: 400, message: 'Неверный период'})
    }

    const userId = event.context.userId
    const scope = SCOPE_ENUM[body.scope]
    const startIso = periodStartISO(body.scope, body.period)
    const periodStart = isoToDate(startIso)
    // План недели (2.0): задаётся только начало; конец в базе — на шаг сетки позже
    const endMin = body.endMin ?? (body.startMin != null ? Math.min(body.startMin + PLAN_SLOT_MIN, 24 * 60) : null)
    const week = normalizeWeekFields(scope, startIso, {...body, endMin})

    return prisma.$transaction(async (tx) => {
        const last = await tx.planTask.aggregate({
            where: {userId, scope, periodStart, deletedAt: null},
            _max: {position: true},
        })

        const task = await tx.planTask.create({
            data: {
                userId,
                scope,
                periodStart,
                position: (last._max.position ?? -1) + 1,
                title: body.title,
                description: body.description?.trim() || null,
                comment: body.comment?.trim() || null,
                ...week,
            },
            select: planTaskSelect,
        })
        if (!week.day) return toPlanItem(task)

        // В занятую ячейку: стоявшие там задачи сдвигаются вниз до первой свободной
        await placeWeekTask(tx, {userId, periodStart, day: week.day, task, slot: slotOf(task.startMin!), mode: 'push'})
        const placed = await tx.planTask.findUnique({where: {id: task.id}, select: planTaskSelect})
        return toPlanItem(placed)
    })
})
