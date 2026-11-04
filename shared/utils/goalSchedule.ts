import type {DaySlot, GoalDueSettings} from '~~/shared/constants/notifications'
import {DAY_SLOTS} from '~~/shared/constants/notifications'
import type {GoalRemind} from '~~/shared/types/goal'
import {addDays, timeToMin} from '~~/shared/utils/planDates'
import {timeLeft} from '~~/shared/utils/goals'
import {REMINDER_WINDOW_MIN} from '~~/shared/utils/notifySchedule'

// Напоминания о сроках целей и этапов.
// Скоро срок — за N дней; в день срока; просрочено — на следующий день после срока.
// Время — утро, обед или вечер; одна сводка на каждое время дня

export type GoalDueKind = 'overdue' | 'today' | 'soon'
export const GOAL_DUE_ORDER: GoalDueKind[] = ['overdue', 'today', 'soon']

export interface GoalDueEntry {
    goalId: string
    goalTitle: string
    stepTitle: string | null   // null — срок самой цели
    dueDate: string            // 'YYYY-MM-DD'
    remind: GoalRemind | null  // своё напоминание; null — по общим настройкам
}

// Времена дня, для которых «сейчас» пора отправить сводку (с окном догоняния, как у итогов)
export function currentDaySlots(settings: GoalDueSettings, minutes: number): DaySlot[] {
    return DAY_SLOTS.filter((slot) => {
        const at = timeToMin(settings.slots[slot])
        return at != null && minutes >= at && minutes < at + REMINDER_WINDOW_MIN
    })
}

// О чём напомнить по сроку в это время дня сегодня (или ничего)
export function goalDueKind(
    entry: Pick<GoalDueEntry, 'dueDate' | 'remind'>,
    slot: DaySlot,
    settings: GoalDueSettings,
    today: string,
): GoalDueKind | null {
    const own = entry.remind

    // Просрочено — всегда по общим настройкам
    if (settings.overdue.enabled && settings.overdue.slot === slot && entry.dueDate === addDays(today, -1)) {
        return 'overdue'
    }

    // В день срока: своё время или общее (если включено)
    const daySlot = own ? own.daySlot : settings.due.enabled ? settings.due.slot : null
    if (daySlot === slot && entry.dueDate === today) return 'today'

    // Скоро срок: своё «за N дней» или общее (если включено)
    const soon = own
        ? {days: own.daysBefore, slot: own.soonSlot}
        : settings.soon.enabled ? {days: settings.soon.daysBefore, slot: settings.soon.slot} : null
    if (soon && soon.slot === slot && entry.dueDate === addDays(today, soon.days)) return 'soon'

    return null
}

const KIND_TITLE: Record<GoalDueKind, string> = {overdue: 'просрочено', today: 'сегодня срок', soon: 'скоро срок'}
const MAX_LINES = 6

function lineOf(item: GoalDueEntry & { kind: GoalDueKind }, today: string): string {
    const name = item.stepTitle ? `«${item.goalTitle}» → этап «${item.stepTitle}»` : `«${item.goalTitle}»`
    if (item.kind === 'overdue') return `${name} — просрочено (срок был вчера)`
    if (item.kind === 'today') return `${name} — срок сегодня`
    // Дату срока видно в самой цели — здесь важнее, сколько осталось
    return `${name} — осталось ${timeLeft(today, item.dueDate)}`
}

// Сводка для колокольчика: заголовок со счётчиками, по строке на цель или этап, ссылка
export function goalDueDigest(items: Array<GoalDueEntry & { kind: GoalDueKind }>, today: string) {
    const sorted = [...items].sort((a, b) =>
        GOAL_DUE_ORDER.indexOf(a.kind) - GOAL_DUE_ORDER.indexOf(b.kind) || a.dueDate.localeCompare(b.dueDate))

    const counts = GOAL_DUE_ORDER
        .map(kind => ({kind, n: sorted.filter(i => i.kind === kind).length}))
        .filter(c => c.n)
        .map(c => `${KIND_TITLE[c.kind]} ${c.n}`)

    const lines = sorted.slice(0, MAX_LINES).map(i => lineOf(i, today))
    if (sorted.length > MAX_LINES) lines.push(`и ещё ${sorted.length - MAX_LINES}`)

    // Всё про одну цель — ссылка сразу открывает её окно
    const goalIds = new Set(sorted.map(i => i.goalId))
    const link = goalIds.size === 1 ? `/goals?open=${sorted[0]!.goalId}` : '/goals'

    return {
        title: `Цели: ${counts.join(', ')}`,
        body: lines.join('\n'),
        link,
    }
}
