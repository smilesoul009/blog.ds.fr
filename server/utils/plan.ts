import type {z} from 'zod'
import {authCheck, permissionCheck} from '#server/utils/checks'
import {addDays, toISO} from '~~/shared/utils/planDates'

export async function planCheck(event: any) {
    await authCheck(event)
    if (event.context.realUserId) {
        throw createError({statusCode: 403, message: 'Личный план недоступен в режиме просмотра'})
    }
    await permissionCheck('plan:use')(event)
}

export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
    const result = schema.safeParse(body)
    if (!result.success) {
        throw createError({statusCode: 400, message: result.error.issues[0]?.message ?? 'Неверные данные'})
    }
    return result.data
}

export const isoToDate = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

export const planTaskSelect = {
    id: true, scope: true, periodStart: true, position: true, title: true,
    description: true, comment: true, moveCount: true,
    status: true, day: true, startMin: true, endMin: true,
    movedAt: true, movedToId: true,
    movedTo: {select: {scope: true, periodStart: true, day: true}},
} as const

export function toPlanItem(t: any) {
    return {
        ...t,
        periodStart: toISO(t.periodStart),
        day: t.day ? toISO(t.day) : null,
        movedAt: t.movedAt ?? null,
        movedTo: t.movedTo
            ? {
                scope: t.movedTo.scope,
                periodStart: toISO(t.movedTo.periodStart),
                day: t.movedTo.day ? toISO(t.movedTo.day) : null,
            }
            : null,
    }
}

// Неделя: либо день и время (план), либо ничего (список). Остальные периоды — всегда пусто
export function normalizeWeekFields(
    scope: string,
    periodStartIso: string,
    data: { day?: string | null; startMin?: number | null; endMin?: number | null },
) {
    const {day, startMin, endMin} = data

    // Задача списка недели: без дня и времени
    if (!day && startMin == null && endMin == null) return {day: null, startMin: null, endMin: null}

    if (!day || startMin == null || endMin == null) {
        throw createError({statusCode: 400, message: 'Для задачи в плане недели нужны день и время'})
    }
    if (day < periodStartIso || day > addDays(periodStartIso, 6)) {
        throw createError({statusCode: 400, message: 'День не входит в эту неделю'})
    }
    if (endMin <= startMin) {
        throw createError({statusCode: 400, message: 'Конец должен быть позже начала'})
    }
    return {day: isoToDate(day), startMin, endMin}
}