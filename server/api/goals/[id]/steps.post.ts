import {prisma} from '#server/db/client'
import {planCheck, parseBody} from '#server/utils/plan'
import {ownGoal, stepSelect, toStepItem} from '#server/utils/goals'
import {stepCreateSchema} from '~~/shared/schemas/goal'

// Новый этап — в конец списка
export default defineEventHandler(async (event) => {
    await planCheck(event)

    const goal = await ownGoal(event, getRouterParam(event, 'id')!)
    const body = parseBody(stepCreateSchema, await readBody(event))
    const last = await prisma.planGoalStep.aggregate({where: {goalId: goal.id}, _max: {position: true}})

    const step = await prisma.planGoalStep.create({
        data: {goalId: goal.id, title: body.title, position: (last._max.position ?? -1) + 1},
        select: stepSelect,
    })
    return toStepItem(step)
})
