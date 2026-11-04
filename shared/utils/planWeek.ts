// ── План недели (2.0): у задачи только время начала, все задачи одной высоты ──
// День делится на ячейки по PLAN_SLOT_MIN минут; в ячейке — не больше одной задачи.
// Длительность (endMin) в базе остаётся, но не показывается и не используется для раскладки

export const PLAN_SLOT_MIN = 15                        // шаг сетки, добавления и перетаскивания
export const PLAN_SLOT_PX = 28                         // высота ячейки (час = 112 px); при 20 px текст слишком мелкий
export const PLAN_SLOTS = (24 * 60) / PLAN_SLOT_MIN    // ячеек в дне (96)

export const slotOf = (min: number) => Math.min(PLAN_SLOTS - 1, Math.max(0, Math.floor(min / PLAN_SLOT_MIN)))
export const slotMin = (slot: number) => slot * PLAN_SLOT_MIN

export type DaySlots = Map<string, number>    // id задачи → ячейка

interface SlotTask {
    id: string
    startMin: number | null
    position?: number
}

// Раскладка дня: время округляется вниз до ячейки; совпадения (старые задачи) — цепочкой вниз,
// по порядку начала. В базу раскладка записывается, только когда в этом дне что-то ставят или переносят
export function layoutDay(tasks: SlotTask[]): DaySlots {
    const sorted = [...tasks].sort((a, b) =>
        (a.startMin ?? 0) - (b.startMin ?? 0) || (a.position ?? 0) - (b.position ?? 0) || a.id.localeCompare(b.id))
    const out: DaySlots = new Map()
    let next = 0
    for (const t of sorted) {
        const slot = Math.min(Math.max(slotOf(t.startMin ?? 0), next), PLAN_SLOTS - 1)
        out.set(t.id, slot)
        next = slot + 1
    }
    return out
}

// Поставить задачу id в ячейку slot. Задача, стоявшая там, сдвигается на ячейку ниже, и так до первой
// свободной ячейки — дальше ничего не трогается. null — до конца дня места не хватило
export function placeInSlot(slots: DaySlots, id: string, slot: number): DaySlots | null {
    const out: DaySlots = new Map(slots)
    out.delete(id)
    const bySlot = new Map([...out].map(([taskId, s]) => [s, taskId]))
    out.set(id, slot)
    let s = slot
    let moving = bySlot.get(s)
    while (moving) {
        s++
        if (s >= PLAN_SLOTS) return null
        const nextMoving = bySlot.get(s)
        out.set(moving, s)
        moving = nextMoving
    }
    return out
}

// Первая свободная ячейка начиная с slot (копирование: чужие задачи не сдвигаем). null — до конца дня всё занято
export function firstFreeSlot(slots: DaySlots, slot: number): number | null {
    const taken = new Set(slots.values())
    for (let s = slot; s < PLAN_SLOTS; s++) if (!taken.has(s)) return s
    return null
}

export const NO_ROOM_MESSAGE = 'До конца дня нет свободного места'
