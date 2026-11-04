import type {GoalProgress} from '~~/shared/types/goal'
import {MONTHS_GEN, parseISO, todayISO} from '~~/shared/utils/planDates'

// Прогресс цели: «частично» считается как половина
export function goalPercent(p: GoalProgress): number {
    if (!p.total) return 0
    return Math.round(((p.done + p.partial / 2) / p.total) * 100)
}

export function goalBar(p: GoalProgress) {
    if (!p.total) return {done: 0, partial: 0}
    return {done: (p.done / p.total) * 100, partial: (p.partial / p.total) * 100}
}

const daysBetween = (from: string, to: string) =>
    Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86_400_000)

// «до 25 окт»
export function dueLabel(iso: string): string {
    const d = parseISO(iso)
    const year = d.getUTCFullYear() !== parseISO(todayISO()).getUTCFullYear() ? ` ${d.getUTCFullYear()}` : ''
    return `до ${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]!.slice(0, 3)}${year}`
}

// Срок прошёл — 'late', осталось 3 дня или меньше — 'soon'. Выполненное не подсвечиваем
export function dueState(iso: string | null, finished: boolean): '' | 'soon' | 'late' {
    if (!iso || finished) return ''
    const left = daysBetween(todayISO(), iso)
    if (left < 0) return 'late'
    if (left <= 3) return 'soon'
    return ''
}

export const DUE_CLASS = {'': 'text-dimmed', soon: 'text-warning', late: 'text-error'} as const

// «просрочен на 3 дня» / «сегодня» / «через 5 дней»
export function dueHint(iso: string): string {
    const left = daysBetween(todayISO(), iso)
    const word = (n: number) => {
        const m10 = n % 10, m100 = n % 100
        if (m10 === 1 && m100 !== 11) return 'день'
        if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня'
        return 'дней'
    }
    if (left === 0) return 'сегодня'
    if (left < 0) return `просрочен на ${-left} ${word(-left)}`
    return `через ${left} ${word(left)}`
}

// Сколько осталось до срока по календарю: «1 г. 2 м. 3 д.», «6 м. 3 д.», «3 д.»; 0 — пустая строка
export function timeLeft(fromISO: string, toISO: string): string {
    if (toISO <= fromISO) return ''
    const [fy, fm, fd] = fromISO.split('-').map(Number) as [number, number, number]
    const [ty, tm, td] = toISO.split('-').map(Number) as [number, number, number]
    let months = (ty - fy) * 12 + (tm - fm)
    if (td < fd) months--
    // Дата через months месяцев (день не больше последнего дня месяца)
    const y = fy + Math.floor((fm - 1 + months) / 12)
    const m = (fm - 1 + months) % 12
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    const anchor = Date.UTC(y, m, Math.min(fd, lastDay))
    const days = Math.round((Date.UTC(ty, tm - 1, td) - anchor) / 86_400_000)
    const years = Math.floor(months / 12)
    months %= 12
    return [years && `${years} г.`, months && `${months} м.`, days && `${days} д.`].filter(Boolean).join(' ')
}
