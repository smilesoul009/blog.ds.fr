import {z} from 'zod'

// «Удалённые»: удалённое лежит TRASH_DAYS дней, потом удаляется навсегда (ночная задача trash:purge).
// За TRASH_WARN_DAYS дней до этого — уведомление в колокольчике
export const TRASH_DAYS = 30
export const TRASH_WARN_DAYS = 3

export const TRASH_KINDS = ['tasks', 'goals', 'steps'] as const
export type TrashKind = typeof TRASH_KINDS[number]

export const TRASH_LABEL: Record<TrashKind, { title: string; deleted: string; many: string }> = {
    tasks: {title: 'Удалённые задачи', deleted: 'Задача удалена', many: 'задач'},
    goals: {title: 'Удалённые цели', deleted: 'Цель удалена', many: 'целей'},
    steps: {title: 'Удалённые этапы', deleted: 'Этап удалён', many: 'этапов'},
}

export interface TrashItem {
    id: string
    title: string
    context: string | null     // откуда: «День 22 октября», «Цель „Семинар“»
    deletedAt: string          // ISO
}

export const isTrashKind = (v: unknown): v is TrashKind => TRASH_KINDS.includes(v as TrashKind)

export const trashIdsSchema = z.object({
    ids: z.array(z.string()).min(1).max(1000),
})

// Сколько дней осталось до удаления навсегда
export function trashDaysLeft(deletedAt: string, now = Date.now()): number {
    const left = TRASH_DAYS - Math.floor((now - Date.parse(deletedAt)) / 86_400_000)
    return Math.max(0, left)
}
