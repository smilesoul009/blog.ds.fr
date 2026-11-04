import {z} from 'zod'
import {prisma} from '#server/db/client'
import {planCheck, parseBody, isoToDate} from '#server/utils/plan'
import {planScopeSchema} from '~~/shared/schemas/plan'
import {SCOPE_ENUM, isValidPeriodKey, periodStartISO} from '~~/shared/utils/planDates'

const schema = z.object({
    scope: planScopeSchema,
    period: z.string(),
    note: z.string().max(5000, 'Слишком длинная заметка'),
})

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const body = parseBody(schema, await readBody(event))
    if (!isValidPeriodKey(body.scope, body.period)) {
        throw createError({statusCode: 400, message: 'Неверный период'})
    }

    const key = {
        userId: event.context.userId,
        scope: SCOPE_ENUM[body.scope],
        periodStart: isoToDate(periodStartISO(body.scope, body.period)),
    }
    const note = body.note.trim()

    await prisma.planReview.upsert({
        where: {userId_scope_periodStart: key},
        create: {...key, note},
        update: {note},
    })

    return {note}
})