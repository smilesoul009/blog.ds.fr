import type {H3Event} from 'h3'
import {prisma, prismaAll} from '#server/db/client'
import {TRASH_DAYS, TRASH_LABEL, TRASH_WARN_DAYS, type TrashItem, type TrashKind} from '~~/shared/constants/trash'
import {PLAN_SCOPE_LABELS, SCOPE_KEY, periodKeyFor, periodTitle, toISO} from '~~/shared/utils/planDates'

// «Удалённые» — один механизм для всех видов. Новый вид = одна запись в KINDS.
// owner — условие «только свои» (и контекст, например этапы одной цели); toItem — имя и «откуда» для списка.
// Список, восстановление и удаление навсегда работают через prismaAll (без фильтра «только живые»)

type Query = { goalId?: string }

interface KindConfig {
    delegate: (client: any) => any
    owner: (userId: string, q: Query) => Record<string, unknown>
    select: Record<string, unknown>
    toItem: (row: any) => TrashItem
}

const iso = (d: Date) => d.toISOString()

const KINDS: Record<TrashKind, KindConfig> = {
    tasks: {
        delegate: c => c.planTask,
        owner: userId => ({userId}),
        select: {id: true, title: true, deletedAt: true, scope: true, periodStart: true},
        toItem: (r) => {
            const key = SCOPE_KEY[r.scope as keyof typeof SCOPE_KEY]
            return {
                id: r.id,
                title: r.title,
                context: `${PLAN_SCOPE_LABELS[key]} · ${periodTitle(key, periodKeyFor(key, toISO(r.periodStart)))}`,
                deletedAt: iso(r.deletedAt),
            }
        },
    },
    goals: {
        delegate: c => c.planGoal,
        owner: userId => ({userId}),
        select: {id: true, title: true, deletedAt: true},
        toItem: r => ({id: r.id, title: r.title, context: null, deletedAt: iso(r.deletedAt)}),
    },
    steps: {
        delegate: c => c.planGoalStep,
        // Этапы удалённой цели в «Удалённых» не показываем — они вернутся вместе с целью
        owner: (userId, q) => ({goal: {userId, deletedAt: null}, ...(q.goalId ? {goalId: q.goalId} : {})}),
        select: {id: true, title: true, deletedAt: true, goal: {select: {title: true}}},
        toItem: r => ({id: r.id, title: r.title, context: `Цель «${r.goal.title}»`, deletedAt: iso(r.deletedAt)}),
    },
}

const userOf = (event: H3Event): string => event.context.userId

// Положить в «Удалённые» (только живые свои). Возвращает, сколько удалено
export async function softDelete(event: H3Event, kind: TrashKind, ids: string[]) {
    const k = KINDS[kind]
    const {count} = await k.delegate(prisma).updateMany({
        where: {id: {in: ids}, ...k.owner(userOf(event), {})},
        data: {deletedAt: new Date()},
    })
    return count as number
}

export async function trashList(event: H3Event, kind: TrashKind, q: Query): Promise<TrashItem[]> {
    const k = KINDS[kind]
    const rows = await k.delegate(prismaAll).findMany({
        where: {...k.owner(userOf(event), q), deletedAt: {not: null}},
        orderBy: {deletedAt: 'desc'},
        select: k.select,
        take: 1000,
    })
    return rows.map(k.toItem)
}

export async function trashCount(event: H3Event, kind: TrashKind, q: Query): Promise<number> {
    const k = KINDS[kind]
    return k.delegate(prismaAll).count({where: {...k.owner(userOf(event), q), deletedAt: {not: null}}})
}

// Вернуть из «Удалённых» — один запрос на любое количество
export async function trashRestore(event: H3Event, kind: TrashKind, ids: string[]) {
    const k = KINDS[kind]
    const {count} = await k.delegate(prismaAll).updateMany({
        where: {id: {in: ids}, ...k.owner(userOf(event), {}), deletedAt: {not: null}},
        data: {deletedAt: null},
    })
    return count as number
}

// Удалить навсегда (только то, что уже в «Удалённых») — один запрос
export async function trashPurge(event: H3Event, kind: TrashKind, ids: string[]) {
    const k = KINDS[kind]
    const {count} = await k.delegate(prismaAll).deleteMany({
        where: {id: {in: ids}, ...k.owner(userOf(event), {}), deletedAt: {not: null}},
    })
    return count as number
}

// ── Ночная задача: удалить навсегда то, что лежит дольше TRASH_DAYS, и предупредить заранее ──
const DAY = 86_400_000

export async function purgeOldTrash(now = new Date()) {
    const cutoff = new Date(now.getTime() - TRASH_DAYS * DAY)
    let total = 0
    // Сначала этапы, потом цели (этапы цели удаляются вместе с ней), потом задачи
    for (const delegate of [prismaAll.planGoalStep, prismaAll.planGoal, prismaAll.planTask] as any[]) {
        const {count} = await delegate.deleteMany({where: {deletedAt: {lt: cutoff}}})
        total += count
    }
    return total
}

// Предупреждение: что удалится навсегда через TRASH_WARN_DAYS дней. Окно — одни сутки,
// поэтому при ежедневном запуске о каждом объекте предупреждаем один раз
export async function warnTrashPurge(now = new Date()) {
    const to = new Date(now.getTime() - (TRASH_DAYS - TRASH_WARN_DAYS) * DAY)
    const from = new Date(to.getTime() - DAY)
    const window = {deletedAt: {gte: from, lt: to}}

    const [tasks, goals, steps] = await Promise.all([
        prismaAll.planTask.groupBy({by: ['userId'], where: window, _count: {_all: true}}),
        prismaAll.planGoal.groupBy({by: ['userId'], where: window, _count: {_all: true}}),
        prismaAll.planGoalStep.findMany({where: {...window, goal: {deletedAt: null}}, select: {goal: {select: {userId: true}}}}),
    ])

    const perUser = new Map<string, Record<TrashKind, number>>()
    const add = (userId: string, kind: TrashKind, n: number) => {
        const c = perUser.get(userId) ?? {tasks: 0, goals: 0, steps: 0}
        c[kind] += n
        perUser.set(userId, c)
    }
    for (const t of tasks) add(t.userId, 'tasks', t._count._all)
    for (const g of goals) add(g.userId, 'goals', g._count._all)
    for (const s of steps) add(s.goal.userId, 'steps', 1)
    if (!perUser.size) return 0

    const date = toISO(now)
    const data = [...perUser.entries()].map(([userId, c]) => {
        const parts = (Object.keys(c) as TrashKind[]).filter(k => c[k]).map(k => `${TRASH_LABEL[k].many}: ${c[k]}`)
        return {
            userId,
            type: 'trash:purge',
            title: `Через ${TRASH_WARN_DAYS} дня удалятся навсегда`,
            body: `Из «Удалённых» — ${parts.join(', ')}. Их ещё можно восстановить.`,
            link: c.tasks ? '/plan/now?trash=tasks' : '/goals?trash=goals',
            dedupeKey: `trash-purge:${userId}:${date}`,
            data: {...c},
        }
    })
    const result = await prismaAll.notification.createMany({data, skipDuplicates: true})
    return result.count
}
