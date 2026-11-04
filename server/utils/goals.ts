import type {H3Event} from 'h3'
import {prisma} from '#server/db/client'
import {Prisma} from '@prisma/client'
import {toISO} from '~~/shared/utils/planDates'
import {goalRemindSchema} from '~~/shared/schemas/goal'
import type {GoalRemind} from '~~/shared/types/goal'

// Значение для поля remind в базе: null в Json-поле записывается как Prisma.DbNull
export const remindToDb = (remind: GoalRemind | null) => remind ?? Prisma.DbNull

export const stepSelect = {
    id: true, goalId: true, title: true, description: true, comment: true,
    status: true, dueDate: true, remind: true, position: true,
} as const

export const goalSelect = {
    id: true, title: true, description: true, dueDate: true, remind: true, position: true,
} as const

export const dateOrNull = (iso: string | null | undefined) =>
    iso ? new Date(`${iso}T00:00:00.000Z`) : null

// Своё напоминание из базы — только если оно целиком верное, иначе «по общим»
export function remindOf(value: unknown): GoalRemind | null {
    const parsed = goalRemindSchema.safeParse(value)
    return parsed.success ? parsed.data : null
}

export function toStepItem(s: any) {
    return {...s, dueDate: s.dueDate ? toISO(s.dueDate) : null, remind: remindOf(s.remind)}
}

export function progressOf(steps: { status: string }[]) {
    return {
        total: steps.length,
        done: steps.filter(s => s.status === 'DONE').length,
        partial: steps.filter(s => s.status === 'PARTIAL').length,
    }
}

export function toGoalItem(g: any, steps: { status: string }[]) {
    return {
        id: g.id,
        title: g.title,
        description: g.description,
        dueDate: g.dueDate ? toISO(g.dueDate) : null,
        remind: remindOf(g.remind),
        position: g.position,
        ...progressOf(steps),
    }
}

// Цель текущего пользователя или 404
export async function ownGoal(event: H3Event, id: string) {
    const goal = await prisma.planGoal.findFirst({where: {id, userId: event.context.userId}, select: goalSelect})
    if (!goal) throw createError({statusCode: 404, message: 'Цель не найдена'})
    return goal
}

// Живые этапы цели — для вложенных выборок (расширение «Удалённых» их не фильтрует)
export const aliveSteps = {where: {deletedAt: null}} as const

// Этап цели текущего пользователя или 404 (этап удалённой цели — тоже 404)
export async function ownStep(event: H3Event, id: string) {
    const step = await prisma.planGoalStep.findFirst({
        where: {id, goal: {userId: event.context.userId, deletedAt: null}},
        select: stepSelect,
    })
    if (!step) throw createError({statusCode: 404, message: 'Этап не найден'})
    return step
}
