import {prisma} from '#server/db/client'
import {planCheck, parseBody, planTaskSelect, toPlanItem, normalizeWeekFields} from '#server/utils/plan'
import {planUpdateSchema} from '~~/shared/schemas/plan'
import {toISO} from '~~/shared/utils/planDates'

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const id = getRouterParam(event, 'id')!
    const existing = await prisma.planTask.findFirst({
        where: {id, userId: event.context.userId},
        select: planTaskSelect,
    })
    if (!existing) throw createError({statusCode: 404, message: 'Задача не найдена'})

    const statusBody = (await readBody(event))?.status
    if (existing.movedAt && statusBody !== undefined) {
        throw createError({statusCode: 409, message: 'У перенесённой задачи нельзя менять статус'})
    }

    const body = parseBody(planUpdateSchema, await readBody(event))
    const data: Record<string, any> = {}

    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description?.trim() || null
    if (body.comment !== undefined) data.comment = body.comment?.trim() || null
    if (body.status !== undefined) data.status = body.status

    const timeChanged = body.day !== undefined || body.startMin !== undefined || body.endMin !== undefined
    if (existing.scope === 'WEEK' && timeChanged && !existing.day) {
        throw createError({statusCode: 400, message: 'У задачи списка недели нет дня и времени'})
    }
    if (existing.scope === 'WEEK' && timeChanged) {
        Object.assign(data, normalizeWeekFields('WEEK', toISO(existing.periodStart), {
            day: body.day !== undefined ? body.day : (existing.day ? toISO(existing.day) : null),
            startMin: body.startMin !== undefined ? body.startMin : existing.startMin,
            endMin: body.endMin !== undefined ? body.endMin : existing.endMin,
        }))
    }

    const task = await prisma.planTask.update({where: {id}, data, select: planTaskSelect})
    return toPlanItem(task)
})