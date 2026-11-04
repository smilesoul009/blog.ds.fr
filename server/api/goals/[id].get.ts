import {prisma} from '#server/db/client'
import {planCheck} from '#server/utils/plan'
import {ownGoal, stepSelect, toGoalItem, toStepItem} from '#server/utils/goals'

// Цель с этапами
export default defineEventHandler(async (event) => {
    await planCheck(event)

    const goal = await ownGoal(event, getRouterParam(event, 'id')!)
    const steps = await prisma.planGoalStep.findMany({
        where: {goalId: goal.id},
        orderBy: [{position: 'asc'}, {createdAt: 'asc'}],
        select: stepSelect,
    })
    return {...toGoalItem(goal, steps), steps: steps.map(toStepItem)}
})
