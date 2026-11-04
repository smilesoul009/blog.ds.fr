import type {H3Event} from 'h3'
import {prisma} from '#server/db/client'
import {authCheck} from '#server/utils/checks'
import {ROLE_PERMISSIONS} from '~~/shared/constants/permissions'
import {isValidTimeZone, mergeNotifySettings, zonedNow} from '~~/shared/constants/notifications'
import {dueReviewReminders} from '~~/shared/utils/notifySchedule'
import {SCOPE_ENUM, periodStartISO, periodTitle, toISO} from '~~/shared/utils/planDates'
import {NEXT_LABEL} from '~~/shared/utils/planTasks'
import {currentDaySlots, goalDueDigest, goalDueKind, type GoalDueEntry, type GoalDueKind} from '~~/shared/utils/goalSchedule'
import {remindOf} from '#server/utils/goals'

// Часовой пояс по умолчанию, пока браузер пользователя его не прислал
export const DEFAULT_TIMEZONE = 'Asia/Vladivostok'

export const notificationSelect = {
    id: true, type: true, title: true, body: true, link: true, data: true,
    showAt: true, readAt: true, createdAt: true,
} as const

export async function notificationsCheck(event: H3Event) {
    await authCheck(event)
}

export const reviewDedupeKey = (userId: string, scope: string, periodKey: string) =>
    `plan-review:${userId}:${scope}:${periodKey}`

// Роли, которым доступен «План» (и, значит, напоминания по нему)
const PLAN_ROLES = (Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[])
    .filter(role => ROLE_PERMISSIONS[role].includes('plan:use'))

// Раз в минуту: создать напоминания об итогах, время которых пришло.
// Повторы исключены уникальным dedupeKey (пользователь + период)
export async function createDueReviewReminders(now = new Date()) {
    const users = await prisma.user.findMany({
        where: {isActive: true, deletedAt: null, roles: {hasSome: PLAN_ROLES}},
        select: {id: true, timezone: true, notifySettings: true},
    })

    const data: Array<{
        userId: string; type: string; title: string; body: string; link: string; dedupeKey: string
        data: { scope: string; period: string }
    }> = []

    for (const user of users) {
        const tz = isValidTimeZone(user.timezone) ? user.timezone : DEFAULT_TIMEZONE
        const settings = mergeNotifySettings(user.notifySettings)
        for (const {scope, periodKey} of dueReviewReminders(settings, zonedNow(tz, now))) {
            data.push({
                userId: user.id,
                type: 'plan:review',
                title: `Подведите итоги: ${periodTitle(scope, periodKey)}`,
                body: `Отметьте, что сделано, и составьте план ${NEXT_LABEL[scope]}`,
                link: `/plan/${scope}/${periodKey}?review=1`,
                dedupeKey: reviewDedupeKey(user.id, scope, periodKey),
                data: {scope, period: periodKey},
            })
        }
    }

    if (!data.length) return 0

    // Итоги уже подведены (до времени напоминания) — напоминать не нужно
    const reviewed = await prisma.planReview.findMany({
        where: {
            reviewedAt: {not: null},
            OR: data.map(d => ({
                userId: d.userId,
                scope: SCOPE_ENUM[d.data.scope as keyof typeof SCOPE_ENUM],
                periodStart: new Date(`${periodStartISO(d.data.scope as keyof typeof SCOPE_ENUM, d.data.period)}T00:00:00.000Z`),
            })),
        },
        select: {userId: true, scope: true, periodStart: true},
    })
    const done = new Set(reviewed.map(r => `${r.userId}:${r.scope}:${r.periodStart.toISOString().slice(0, 10)}`))
    const pending = data.filter(d => {
        const scope = d.data.scope as keyof typeof SCOPE_ENUM
        return !done.has(`${d.userId}:${SCOPE_ENUM[scope]}:${periodStartISO(scope, d.data.period)}`)
    })
    if (!pending.length) return 0

    const result = await prisma.notification.createMany({data: pending, skipDuplicates: true})
    return result.count
}

export const goalDueDedupeKey = (userId: string, date: string, slot: string) => `goal-due:${userId}:${date}:${slot}`

// Раз в минуту: сводки о сроках целей и этапов (утро / обед / вечер по часам пользователя).
// Одна сводка на время дня; повторы исключены dedupeKey (пользователь + дата + время дня)
export async function createGoalDueReminders(now = new Date()) {
    const users = await prisma.user.findMany({
        where: {isActive: true, deletedAt: null, roles: {hasSome: PLAN_ROLES}},
        select: {id: true, timezone: true, notifySettings: true},
    })

    // Кому и в какое время дня сейчас пора
    const due = users.flatMap((user) => {
        const tz = isValidTimeZone(user.timezone) ? user.timezone : DEFAULT_TIMEZONE
        const settings = mergeNotifySettings(user.notifySettings).goals
        const {date, minutes} = zonedNow(tz, now)
        return currentDaySlots(settings, minutes).map(slot => ({
            userId: user.id, settings, date, slot, key: goalDueDedupeKey(user.id, date, slot),
        }))
    })
    if (!due.length) return 0

    // Уже отправленные сводки не пересчитываем
    const sent = await prisma.notification.findMany({
        where: {dedupeKey: {in: due.map(d => d.key)}},
        select: {dedupeKey: true},
    })
    const sentKeys = new Set(sent.map(n => n.dedupeKey))
    const pending = due.filter(d => !sentKeys.has(d.key))
    if (!pending.length) return 0

    // Живые цели со сроком (удалённые цели отсекает фильтр клиента). Сроки этапов убраны (2.0) — напоминаем
    // только о сроке цели; этапы нужны, чтобы понять, достигнута ли цель (удалённые этапы — явное deletedAt: null)
    const goals = await prisma.planGoal.findMany({
        where: {
            userId: {in: [...new Set(pending.map(d => d.userId))]},
            dueDate: {not: null},
        },
        select: {
            id: true, userId: true, title: true, dueDate: true, remind: true,
            steps: {where: {deletedAt: null}, select: {status: true}},
        },
    })

    // Что может напомнить о себе: срок цели, если она не достигнута
    const entriesByUser = new Map<string, GoalDueEntry[]>()
    for (const g of goals) {
        const reached = g.steps.length > 0 && g.steps.every(s => s.status === 'DONE')
        if (reached) continue
        const list = entriesByUser.get(g.userId) ?? []
        if (g.dueDate) {
            list.push({goalId: g.id, goalTitle: g.title, stepTitle: null, dueDate: toISO(g.dueDate), remind: remindOf(g.remind)})
        }
        entriesByUser.set(g.userId, list)
    }

    const data = []
    for (const d of pending) {
        const items: Array<GoalDueEntry & { kind: GoalDueKind }> = []
        for (const entry of entriesByUser.get(d.userId) ?? []) {
            const kind = goalDueKind(entry, d.slot, d.settings, d.date)
            if (kind) items.push({...entry, kind})
        }
        if (!items.length) continue
        const digest = goalDueDigest(items, d.date)
        data.push({
            userId: d.userId,
            type: 'goal:due',
            title: digest.title,
            body: digest.body,
            link: digest.link,
            dedupeKey: d.key,
            data: {slot: d.slot, date: d.date, count: items.length},
        })
    }
    if (!data.length) return 0

    const result = await prisma.notification.createMany({data, skipDuplicates: true})
    return result.count
}

// Ночная уборка: прочитанные уведомления старше 30 дней
export async function purgeOldNotifications() {
    const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const result = await prisma.notification.deleteMany({where: {readAt: {lt: threshold}}})
    return result.count
}
