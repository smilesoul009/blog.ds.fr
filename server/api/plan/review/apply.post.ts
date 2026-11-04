import {z} from 'zod'
import {prisma} from '#server/db/client'
import {planCheck, parseBody, isoToDate} from '#server/utils/plan'
import {placeWeekTask} from '#server/utils/planWeek'
import {slotOf} from '~~/shared/utils/planWeek'
import {reviewDedupeKey} from '#server/utils/notifications'
import {planScopeSchema} from '~~/shared/schemas/plan'
import {
    SCOPE_ENUM, addDays, isValidISODate, isValidPeriodKey, mondayOf, periodStartISO, shiftPeriod, toISO,
} from '~~/shared/utils/planDates'

const status = z.enum(['TODO', 'DONE', 'PARTIAL'])

const schema = z.object({
    scope: planScopeSchema,
    period: z.string(),
    note: z.string().max(5000, 'Слишком длинная заметка').optional(),
    items: z.array(z.object({
        id: z.string(),
        action: z.enum(['move', 'copy']).nullable().optional(),
        // Куда: не задано — следующий период. period — ключ периода, day — день для задачи плана недели
        target: z.object({period: z.string().optional(), day: z.string().optional()}).optional(),
        status: status.optional(),
        comment: z.string().max(2000, 'Слишком длинный комментарий').nullable().optional(),
    })).max(500).default([]),
    newTasks: z.array(z.string().trim().min(1).max(300, 'Слишком длинное название')).max(100).default([]),
})

// Итоги периода: всё, что пользователь отметил в черновике, применяется одной транзакцией.
// Либо всё, либо ничего
export default defineEventHandler(async (event) => {
    await planCheck(event)

    const userId = event.context.userId
    const body = parseBody(schema, await readBody(event))
    if (!isValidPeriodKey(body.scope, body.period)) {
        throw createError({statusCode: 400, message: 'Неверный период'})
    }

    const scope = SCOPE_ENUM[body.scope]
    const periodStart = isoToDate(periodStartISO(body.scope, body.period))
    const nextKey = shiftPeriod(body.scope, body.period, 1)
    const nextStart = isoToDate(periodStartISO(body.scope, nextKey))

    const ids = body.items.map(i => i.id)
    if (new Set(ids).size !== ids.length) {
        throw createError({statusCode: 400, message: 'Задача указана дважды'})
    }

    // Только свои задачи этого периода
    const tasks = ids.length
        ? await prisma.planTask.findMany({where: {id: {in: ids}, userId, scope, periodStart}})
        : []
    if (tasks.length !== ids.length) {
        throw createError({statusCode: 409, message: 'Список изменился, обновите страницу'})
    }
    const byId = new Map(tasks.map(t => [t.id, t]))

    for (const item of body.items) {
        const t = byId.get(item.id)!
        if (t.movedAt && (item.action === 'move' || item.status !== undefined)) {
            throw createError({statusCode: 409, message: 'Задача уже перенесена, обновите страницу'})
        }
    }

    // Перенос и копии — в порядке списка; у каждой своё место назначения
    const transfers = body.items
        .filter(i => i.action)
        .map((i) => {
            const t = byId.get(i.id)!
            let key = nextKey
            let day: string | null = t.day ? addDays(toISO(t.day), 7) : null

            if (i.target) {
                if (body.scope === 'week' && t.day) {
                    if (!i.target.day || !isValidISODate(i.target.day)) {
                        throw createError({statusCode: 400, message: 'Неверная дата'})
                    }
                    day = i.target.day
                    key = mondayOf(day)
                } else {
                    if (!i.target.period || !isValidPeriodKey(body.scope, i.target.period)) {
                        throw createError({statusCode: 400, message: 'Неверный период'})
                    }
                    key = i.target.period
                }
                const samePlace = key === body.period && (!t.day || day === toISO(t.day))
                if (i.action === 'move' && samePlace) {
                    throw createError({statusCode: 400, message: 'Перенести задачу на то же место нельзя'})
                }
            }
            return {action: i.action!, task: t, key, day}
        })
        .sort((a, b) => a.task.position - b.task.position)

    const now = new Date()

    await prisma.$transaction(async (tx) => {
        // 1. Статусы и комментарии
        for (const item of body.items) {
            const t = byId.get(item.id)!
            const data: { status?: typeof item.status; comment?: string | null } = {}
            if (item.status !== undefined && item.status !== t.status) data.status = item.status
            if (item.comment !== undefined) data.comment = item.comment?.trim() || null
            if (Object.keys(data).length) await tx.planTask.update({where: {id: t.id}, data})
        }

        // 2. Перенос и копии встают в начало своего периода, сохраняя порядок списка
        const byKey = new Map<string, typeof transfers>()
        for (const tr of transfers) byKey.set(tr.key, [...(byKey.get(tr.key) ?? []), tr])

        for (const [key, group] of byKey) {
            const start = isoToDate(periodStartISO(body.scope, key))
            const first = await tx.planTask.aggregate({
                where: {userId, scope, periodStart: start, deletedAt: null},
                _min: {position: true},
            })
            let position = (first._min.position ?? 0) - group.length

            for (const {action, task: t, day} of group) {
                const copy = await tx.planTask.create({
                    data: {
                        userId,
                        scope,
                        periodStart: start,
                        position: position++,
                        title: t.title,
                        description: t.description,
                        status: 'TODO',
                        // Задача плана недели — выбранный день (по умолчанию тот же через неделю), время то же
                        day: day ? isoToDate(day) : null,
                        startMin: t.startMin,
                        endMin: t.endMin,
                        moveCount: action === 'move' ? t.moveCount + 1 : 0,
                    },
                    select: {id: true, startMin: true, endMin: true, position: true},
                })
                // План недели: то же время, если занято — первая свободная ячейка после него
                if (day && t.startMin != null) {
                    await placeWeekTask(tx, {
                        userId, periodStart: start, day: isoToDate(day), task: copy, slot: slotOf(t.startMin), mode: 'free',
                    })
                }
                if (action === 'move') {
                    await tx.planTask.update({where: {id: t.id}, data: {movedAt: now, movedToId: copy.id}})
                }
            }
        }

        // 3. Новые задачи — в конец следующего периода (у недели — в список, без времени)
        if (body.newTasks.length) {
            const last = await tx.planTask.aggregate({
                where: {userId, scope, periodStart: nextStart},
                _max: {position: true},
            })
            const start = (last._max.position ?? -1) + 1
            await tx.planTask.createMany({
                data: body.newTasks.map((title, i) => ({
                    userId,
                    scope,
                    periodStart: nextStart,
                    position: start + i,
                    title,
                })),
            })
        }

        // 4. Заметка и отметка «итоги подведены»
        const key = {userId, scope, periodStart}
        const note = body.note?.trim()
        await tx.planReview.upsert({
            where: {userId_scope_periodStart: key},
            create: {...key, note: note ?? '', reviewedAt: now},
            update: {...(note !== undefined ? {note} : {}), reviewedAt: now},
        })

        // Напоминание об итогах этого периода выполнено — отмечаем прочитанным
        await tx.notification.updateMany({
            where: {dedupeKey: reviewDedupeKey(userId, body.scope, body.period), readAt: null},
            data: {readAt: now},
        })
    })

    return {
        period: nextKey,
        moved: transfers.filter(t => t.action === 'move').length,
        copied: transfers.filter(t => t.action === 'copy').length,
        created: body.newTasks.length,
    }
})
