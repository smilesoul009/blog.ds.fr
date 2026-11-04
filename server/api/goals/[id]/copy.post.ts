import {prisma} from '#server/db/client'
import {planCheck} from '#server/utils/plan'
import {goalSelect, ownGoal, toGoalItem, aliveSteps} from '#server/utils/goals'

// Копия цели — шаблон: этапы в «Не выполнено», без комментариев и сроков
export default defineEventHandler(async (event) => {
    await planCheck(event)

    const userId = event.context.userId
    const source = await ownGoal(event, getRouterParam(event, 'id')!)
    const steps = await prisma.planGoalStep.findMany({
        where: {goalId: source.id},
        orderBy: [{position: 'asc'}, {createdAt: 'asc'}],
        select: {title: true, description: true},
    })
    const last = await prisma.planGoal.aggregate({where: {userId}, _max: {position: true}})

    const goal = await prisma.planGoal.create({
        data: {
            userId,
            title: `Копия: ${source.title}`.slice(0, 300),
            description: source.description,
            position: (last._max.position ?? -1) + 1,
            steps: {create: steps.map((s, position) => ({title: s.title, description: s.description, position}))},
        },
        select: {...goalSelect, steps: {...aliveSteps, select: {status: true}}},
    })
    return toGoalItem(goal, goal.steps)
})
