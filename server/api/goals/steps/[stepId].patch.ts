import {prisma} from '#server/db/client'
import {planCheck, parseBody} from '#server/utils/plan'
import {dateOrNull, ownStep, remindToDb, stepSelect, toStepItem} from '#server/utils/goals'
import {stepUpdateSchema} from '~~/shared/schemas/goal'

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const {id} = await ownStep(event, getRouterParam(event, 'stepId')!)
    const body = parseBody(stepUpdateSchema, await readBody(event))

    const data: Record<string, any> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description?.trim() || null
    if (body.comment !== undefined) data.comment = body.comment?.trim() || null
    if (body.status !== undefined) data.status = body.status
    if (body.dueDate !== undefined) data.dueDate = dateOrNull(body.dueDate)
    if (body.remind !== undefined) data.remind = remindToDb(body.remind)

    const step = await prisma.planGoalStep.update({where: {id}, data, select: stepSelect})
    return toStepItem(step)
})
