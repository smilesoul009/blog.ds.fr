import {
    NO_ROOM_MESSAGE, PLAN_SLOT_MIN, firstFreeSlot, layoutDay, placeInSlot, slotMin, type DaySlots,
} from '~~/shared/utils/planWeek'

// План недели: поставить задачу в ячейку дня и записать время всех задач, которые при этом сдвинулись.
// Вызывается внутри prisma.$transaction — день меняется целиком или не меняется совсем

interface Row {
    id: string
    startMin: number | null
    endMin: number | null
    position: number
}

const rowSelect = {id: true, startMin: true, endMin: true, position: true} as const

// Длительность в базе не показывается, но сохраняется (на неё опираются старые версии сайта)
function duration(row?: Row) {
    if (!row || row.startMin == null || row.endMin == null || row.endMin <= row.startMin) return PLAN_SLOT_MIN
    return row.endMin - row.startMin
}

export async function placeWeekTask(tx: any, p: {
    userId: string
    periodStart: Date
    day: Date
    task: Row
    slot: number
    mode: 'push' | 'free'    // push — занятую ячейку освободить сдвигом вниз; free — первая свободная начиная с slot
}) {
    const rows: Row[] = await tx.planTask.findMany({
        where: {userId: p.userId, scope: 'WEEK', periodStart: p.periodStart, day: p.day, deletedAt: null, id: {not: p.task.id}},
        select: rowSelect,
    })
    const base = layoutDay(rows)

    let slots: DaySlots | null
    if (p.mode === 'push') {
        slots = placeInSlot(base, p.task.id, p.slot)
    } else {
        const free = firstFreeSlot(base, p.slot)
        slots = free == null ? null : new Map(base).set(p.task.id, free)
    }
    if (!slots) throw createError({statusCode: 409, message: NO_ROOM_MESSAGE})

    const byId = new Map([...rows, p.task].map(r => [r.id, r]))
    for (const [id, slot] of slots) {
        const row = byId.get(id)
        const start = slotMin(slot)
        const isTask = id === p.task.id
        if (!isTask && row?.startMin === start) continue
        await tx.planTask.update({
            where: {id},
            data: {
                startMin: start,
                endMin: Math.min(start + duration(row), 24 * 60),
                ...(isTask ? {day: p.day} : {}),
            },
        })
    }
    return slots.get(p.task.id)!
}
