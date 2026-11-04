import {prisma} from '#server/db/client'
import {planCheck, parseBody} from '#server/utils/plan'
import {goalSelect, toGoalItem} from '#server/utils/goals'
import {goalCreateSchema} from '~~/shared/schemas/goal'

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const userId = event.context.userId
    const body = parseBody(goalCreateSchema, await readBody(event))
    const last = await prisma.planGoal.aggregate({where: {userId}, _max: {position: true}})

    const goal = await prisma.planGoal.create({
        data: {userId, title: body.title, position: (last._max.position ?? -1) + 1},
        select: goalSelect,
    })
    return toGoalItem(goal, [])
})
