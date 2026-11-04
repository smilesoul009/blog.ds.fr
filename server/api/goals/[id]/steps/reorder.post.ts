import {prisma} from '#server/db/client'
import {planCheck, parseBody} from '#server/utils/plan'
import {ownGoal} from '#server/utils/goals'
import {stepReorderSchema} from '~~/shared/schemas/goal'

// Порядок этапов (и смена статуса при перетаскивании в другую область)
export default defineEventHandler(async (event) => {
    await planCheck(event)

    const goal = await ownGoal(event, getRouterParam(event, 'id')!)
    const body = parseBody(stepReorderSchema, await readBody(event))
    const existing = await prisma.planGoalStep.findMany({where: {goalId: goal.id}, select: {id: true}})

    const known = new Set(existing.map(s => s.id))
    const same = body.ids.length === known.size
        && new Set(body.ids).size === body.ids.length
        && body.ids.every(id => known.has(id))
    if (!same) throw createError({statusCode: 409, message: 'Список изменился, обновите страницу'})

    await prisma.$transaction(body.ids.map((id, position) => prisma.planGoalStep.update({
        where: {id},
        data: body.moved?.id === id ? {position, status: body.moved.status} : {position},
    })))
    return {ok: true}
})
