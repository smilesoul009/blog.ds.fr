import {prisma} from '#server/db/client'
import {authCheck, permissionCheck} from '#server/utils/checks'
import {isoToDate, planTaskSelect, toPlanItem} from '#server/utils/plan'
import {isValidISODate} from '~~/shared/utils/planDates'

// Задачи на сегодня для главной панели: список дня и план недели на этот день.
// Нет права или просмотр от имени другого — блок просто не показываем
export default defineEventHandler(async (event) => {
    await authCheck(event)
    if (event.context.realUserId) return {enabled: false}
    try {
        await permissionCheck('plan:use')(event)
    } catch {
        return {enabled: false}
    }

    // «Сегодня» присылает браузер — по часам пользователя
    const date = String(getQuery(event).date ?? '')
    if (!isValidISODate(date)) throw createError({statusCode: 400, message: 'Неверная дата'})

    const userId = event.context.userId
    const d = isoToDate(date)

    const [day, plan] = await Promise.all([
        prisma.planTask.findMany({
            where: {userId, scope: 'DAY', periodStart: d, movedAt: null},
            orderBy: [{position: 'asc'}, {createdAt: 'asc'}],
            select: planTaskSelect,
        }),
        prisma.planTask.findMany({
            where: {userId, scope: 'WEEK', day: d, movedAt: null},
            orderBy: [{startMin: 'asc'}],
            select: planTaskSelect,
        }),
    ])

    return {enabled: true, day: day.map(toPlanItem), plan: plan.map(toPlanItem)}
})