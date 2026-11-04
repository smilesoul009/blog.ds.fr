import {prisma} from '#server/db/client'
import {planCheck, parseBody} from '#server/utils/plan'
import {dateOrNull, goalSelect, ownGoal, remindToDb, toGoalItem, aliveSteps} from '#server/utils/goals'
import {goalUpdateSchema} from '~~/shared/schemas/goal'

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const {id} = await ownGoal(event, getRouterParam(event, 'id')!)
    const body = parseBody(goalUpdateSchema, await readBody(event))

    const data: Record<string, any> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description?.trim() || null
    if (body.dueDate !== undefined) data.dueDate = dateOrNull(body.dueDate)
    if (body.remind !== undefined) data.remind = remindToDb(body.remind)

    const goal = await prisma.planGoal.update({
        where: {id},
        data,
        select: {...goalSelect, steps: {...aliveSteps, select: {status: true}}},
    })
    return toGoalItem(goal, goal.steps)
})
