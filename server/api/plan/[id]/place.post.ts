import {z} from 'zod'
import {prisma} from '#server/db/client'
import {planCheck, parseBody, isoToDate} from '#server/utils/plan'
import {placeWeekTask} from '#server/utils/planWeek'
import {addDays, toISO} from '~~/shared/utils/planDates'
import {PLAN_SLOT_MIN, slotOf} from '~~/shared/utils/planWeek'

// План недели: перетаскивание задачи на день и время (copy — с Ctrl: копия, исходная остаётся на месте).
// Задачи в занятой ячейке и ниже сдвигаются до первой свободной (одна задача — одно время)
const schema = z.object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Неверная дата'),
    startMin: z.number().int().min(0).max(24 * 60 - PLAN_SLOT_MIN)
        .refine(m => m % PLAN_SLOT_MIN === 0, `Время — с шагом ${PLAN_SLOT_MIN} минут`),
    copy: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const userId = event.context.userId
    const id = getRouterParam(event, 'id')!
    const body = parseBody(schema, await readBody(event))

    const task = await prisma.planTask.findFirst({
        where: {id, userId},
        select: {
            id: true, scope: true, periodStart: true, day: true, startMin: true, endMin: true, position: true,
            title: true, description: true,
        },
    })
    if (!task) throw createError({statusCode: 404, message: 'Задача не найдена'})
    if (task.scope !== 'WEEK' || !task.day) {
        throw createError({statusCode: 400, message: 'Перетаскивать можно только задачи плана недели'})
    }

    const weekStart = toISO(task.periodStart)
    if (body.day < weekStart || body.day > addDays(weekStart, 6)) {
        throw createError({statusCode: 400, message: 'День не входит в эту неделю'})
    }

    const day = isoToDate(body.day)
    await prisma.$transaction(async (tx) => {
        let placed = task
        if (body.copy) {
            // Копия — как «Копировать на дату»: новая задача, статус «не выполнено»; длительность прежняя
            const last = await tx.planTask.aggregate({
                where: {userId, scope: 'WEEK', periodStart: task.periodStart, deletedAt: null},
                _max: {position: true},
            })
            placed = await tx.planTask.create({
                data: {
                    userId,
                    scope: 'WEEK',
                    periodStart: task.periodStart,
                    position: (last._max.position ?? -1) + 1,
                    title: task.title,
                    description: task.description,
                    status: 'TODO',
                    day,
                    startMin: task.startMin,
                    endMin: task.endMin,
                },
                select: {
                    id: true, scope: true, periodStart: true, day: true, startMin: true, endMin: true, position: true,
                    title: true, description: true,
                },
            })
        }
        await placeWeekTask(tx, {userId, periodStart: task.periodStart, day, task: placed, slot: slotOf(body.startMin), mode: 'push'})
    })

    return {ok: true}
})
