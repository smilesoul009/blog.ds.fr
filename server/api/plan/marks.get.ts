import {prisma} from '#server/db/client'
import {planCheck, isoToDate} from '#server/utils/plan'
import {mondayOf, toISO} from '~~/shared/utils/planDates'
import {isPickKind, isPlanYear} from '~~/shared/utils/planYears'

// Календарь года: в каких периодах года есть задачи (точки «•»). Один запрос на вид.
// month — '2026-10'; day — дата; week — понедельник недели со списком задач (без времени);
// weekly — понедельник недели, где есть задачи сетки (с днём и временем)
export default defineEventHandler(async (event) => {
    await planCheck(event)

    const {year, kind} = getQuery(event) as { year?: string; kind?: string }
    if (!isPlanYear(year) || !isPickKind(kind)) {
        throw createError({statusCode: 400, message: 'Неверный год или вид периода'})
    }

    const from = kind === 'week' || kind === 'weekly' ? mondayOf(`${year}-01-01`) : `${year}-01-01`
    const where: Record<string, unknown> = {
        userId: event.context.userId,
        periodStart: {gte: isoToDate(from), lte: isoToDate(`${year}-12-31`)},
        movedAt: null,
    }
    if (kind === 'month') where.scope = 'MONTH'
    if (kind === 'day') where.scope = 'DAY'
    if (kind === 'week') Object.assign(where, {scope: 'WEEK', day: null})
    if (kind === 'weekly') Object.assign(where, {scope: 'WEEK', day: {not: null}})

    const rows = await prisma.planTask.groupBy({by: ['periodStart'], where: where as any})
    const keys = rows.map(r => {
        const iso = toISO(r.periodStart)
        return kind === 'month' ? iso.slice(0, 7) : iso
    })
    return {keys}
})
