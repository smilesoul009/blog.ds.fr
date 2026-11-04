import {z} from 'zod'
import {prisma} from '#server/db/client'
import {planCheck, parseBody, isoToDate, planTaskSelect, toPlanItem} from '#server/utils/plan'
import {placeWeekTask} from '#server/utils/planWeek'
import {slotOf} from '~~/shared/utils/planWeek'
import {
    SCOPE_KEY, addDays, isValidISODate, isValidPeriodKey, mondayOf, periodKeyFor, periodStartISO, shiftPeriod, toISO,
} from '~~/shared/utils/planDates'

const schema = z.object({
    mode: z.enum(['move', 'copy']),
    period: z.string().optional(),   // день/месяц/год: ключ целевого периода
    day: z.string().optional(),      // неделя: конкретная дата
})

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const userId = event.context.userId
    const id = getRouterParam(event, 'id')!
    const body = parseBody(schema, await readBody(event))

    const task = await prisma.planTask.findFirst({where: {id, userId}})
    if (!task) throw createError({statusCode: 404, message: 'Задача не найдена'})
    if (body.mode === 'move' && task.movedAt) {
        throw createError({statusCode: 409, message: 'Задача уже перенесена'})
    }

    const scopeKey = SCOPE_KEY[task.scope]
    const currentKey = periodKeyFor(scopeKey, toISO(task.periodStart))

    let targetKey: string
    let targetDay: string | null = null

    if (scopeKey === 'week' && task.day) {
        if (body.day) {
            if (!isValidISODate(body.day)) throw createError({statusCode: 400, message: 'Неверная дата'})
            targetDay = body.day
            targetKey = mondayOf(body.day)
        } else {
            targetKey = shiftPeriod('week', currentKey, 1)
            targetDay = task.day ? addDays(toISO(task.day), 7) : targetKey
        }
    } else {
        targetKey = body.period ?? shiftPeriod(scopeKey, currentKey, 1)
    }

    if (!isValidPeriodKey(scopeKey, targetKey)) {
        throw createError({statusCode: 400, message: 'Неверный период'})
    }
    if (body.mode === 'move' && targetKey === currentKey && (scopeKey !== 'week' || targetDay === (task.day && toISO(task.day)))) {
        throw createError({statusCode: 400, message: 'Выберите другой период'})
    }

    const periodStart = isoToDate(periodStartISO(scopeKey, targetKey))

    const copy = await prisma.$transaction(async (tx) => {
        // Перенесённая задача встаёт в начало списка
        const first = await tx.planTask.aggregate({
            where: {userId, scope: task.scope, periodStart, deletedAt: null},
            _min: {position: true},
        })
        const created = await tx.planTask.create({
            data: {
                userId,
                scope: task.scope,
                periodStart,
                position: (first._min.position ?? 1) - 1,
                title: task.title,
                description: task.description,
                status: 'TODO',
                day: targetDay ? isoToDate(targetDay) : null,
                startMin: task.startMin,
                endMin: task.endMin,
                // Перенос продолжает цепочку, копия начинает заново. Комментарий остаётся у исходной задачи
                moveCount: body.mode === 'move' ? task.moveCount + 1 : 0,
            },
            select: planTaskSelect,
        })
        if (body.mode === 'move') {
            await tx.planTask.update({where: {id}, data: {movedAt: new Date(), movedToId: created.id}})
        }
        if (!targetDay) return created

        // План недели: то же время, если оно занято — первая свободная ячейка после него (чужие задачи не сдвигаем)
        await placeWeekTask(tx, {
            userId, periodStart, day: isoToDate(targetDay), task: created,
            slot: slotOf(created.startMin ?? 0), mode: 'free',
        })
        return tx.planTask.findUnique({where: {id: created.id}, select: planTaskSelect})
    })

    return {task: toPlanItem(copy), period: targetKey}
})