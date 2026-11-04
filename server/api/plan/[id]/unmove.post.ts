import {prisma} from '#server/db/client'
import {planCheck} from '#server/utils/plan'

export default defineEventHandler(async (event) => {
    await planCheck(event)

    const userId = event.context.userId
    const id = getRouterParam(event, 'id')!

    const task = await prisma.planTask.findFirst({
        where: {id, userId},
        select: {id: true, movedAt: true, movedTo: {select: {id: true, status: true, movedAt: true}}},
    })
    if (!task) throw createError({statusCode: 404, message: 'Задача не найдена'})
    if (!task.movedAt) throw createError({statusCode: 400, message: 'Задача не перенесена'})

    const copy = task.movedTo
    if (copy && (copy.status !== 'TODO' || copy.movedAt)) {
        throw createError({
            statusCode: 409,
            message: 'Перенесённую задачу уже отметили или перенесли дальше — отмена невозможна',
        })
    }

    await prisma.$transaction([
        ...(copy ? [prisma.planTask.deleteMany({where: {id: copy.id, userId}})] : []),
        prisma.planTask.update({where: {id}, data: {movedAt: null, movedToId: null}}),
    ])

    return {ok: true}
})