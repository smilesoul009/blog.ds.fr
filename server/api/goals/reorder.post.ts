import {prisma} from '#server/db/client'
import {planCheck, parseBody} from '#server/utils/plan'
import {goalReorderSchema} from '~~/shared/schemas/goal'

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const userId = event.context.userId
    const {ids} = parseBody(goalReorderSchema, await readBody(event))
    const existing = await prisma.planGoal.findMany({where: {userId}, select: {id: true}})

    const known = new Set(existing.map(g => g.id))
    if (ids.length !== known.size || new Set(ids).size !== ids.length || !ids.every(id => known.has(id))) {
        throw createError({statusCode: 409, message: 'Список изменился, обновите страницу'})
    }

    await prisma.$transaction(ids.map((id, position) => prisma.planGoal.update({where: {id}, data: {position}})))
    return {ok: true}
})
