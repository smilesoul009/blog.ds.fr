import {prisma} from '#server/db/client'
import {planCheck} from '#server/utils/plan'
import {goalSelect, toGoalItem, aliveSteps} from '#server/utils/goals'

// Список целей с прогрессом (удалённые не входят — фильтр в server/db/client.ts)
export default defineEventHandler(async (event) => {
    await planCheck(event)

    const goals = await prisma.planGoal.findMany({
        where: {userId: event.context.userId},
        orderBy: [{position: 'asc'}, {createdAt: 'asc'}],
        select: {...goalSelect, steps: {...aliveSteps, select: {status: true}}},
    })
    return {items: goals.map(g => toGoalItem(g, g.steps))}
})
