import {prisma} from '#server/db/client'
import {planCheck, isoToDate} from '#server/utils/plan'
import {SCOPE_ENUM, isPlanScope, isValidPeriodKey, periodStartISO} from '~~/shared/utils/planDates'

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const {scope, period} = getQuery(event) as { scope?: string; period?: string }
    if (!isPlanScope(scope) || !period || !isValidPeriodKey(scope, period)) {
        throw createError({statusCode: 400, message: 'Неверный период'})
    }

    const review = await prisma.planReview.findUnique({
        where: {
            userId_scope_periodStart: {
                userId: event.context.userId,
                scope: SCOPE_ENUM[scope],
                periodStart: isoToDate(periodStartISO(scope, period)),
            },
        },
        select: {note: true, reviewedAt: true},
    })

    return {note: review?.note ?? '', reviewedAt: review?.reviewedAt ?? null}
})