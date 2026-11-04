import type {PlanStatus, PlanTaskItem} from '~~/shared/types/plan'
import {MONTHS, MONTHS_GEN, SCOPE_KEY, parseISO, periodKeyFor, type PlanScopeKey} from '~~/shared/utils/planDates'


export const STATUS_ORDER: PlanStatus[] = ['TODO', 'PARTIAL', 'DONE']

export const STATUS_LABEL: Record<PlanStatus, string> = {
    TODO: 'Не выполнено',
    PARTIAL: 'Частично',
    DONE: 'Выполнено',
}

// Порядок показа: не выполнено → частично → выполнено → перенесено; внутри — по position
export function displayOrder(tasks: PlanTaskItem[]): PlanTaskItem[] {
    return [
        ...STATUS_ORDER.flatMap(s => tasks.filter(t => !t.movedAt && t.status === s)),
        ...tasks.filter(t => t.movedAt),
    ]
}

export function formatDuration(min: number): string {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (!h) return `${m} мин`
    if (!m) return `${h} ч`
    return `${h} ч ${m} мин`
}

// Раскладка пересекающихся элементов по колонкам.
// Пересечение считаем по реальному времени (end), видимая высота (visEnd) — только для рисования
export function layoutColumns<T extends { start: number; end: number }>(
    list: T[],
): Array<T & { col: number; cols: number }> {
    const sorted = [...list].sort((a, b) => a.start - b.start || a.end - b.end)
    const result: Array<T & { col: number; cols: number }> = []
    let cluster: T[] = []
    let clusterEnd = -1

    const flush = () => {
        const colEnds: number[] = []
        const placed = cluster.map((item) => {
            let col = colEnds.findIndex(end => end <= item.start)
            if (col === -1) {
                col = colEnds.length
                colEnds.push(item.end)
            } else {
                colEnds[col] = item.end
            }
            return {item, col}
        })
        for (const p of placed) result.push({...p.item, col: p.col, cols: colEnds.length})
        cluster = []
        clusterEnd = -1
    }

    for (const item of sorted) {
        if (cluster.length && item.start >= clusterEnd) flush()
        cluster.push(item)
        clusterEnd = Math.max(clusterEnd, item.end)
    }
    if (cluster.length) flush()
    return result
}

export function tasksWord(n: number): string {
    const m10 = n % 10
    const m100 = n % 100
    if (m10 === 1 && m100 !== 11) return 'задача'
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'задачи'
    return 'задач'
}

export const NEXT_LABEL: Record<PlanScopeKey, string> = {
    day: 'на завтра',
    week: 'на следующую неделю',
    month: 'на следующий месяц',
    year: 'на следующий год',
    year3: 'на следующие 3 года',
    year2: 'на следующие 2 года',
}

function dayShort(iso: string) {
    const d = parseISO(iso)
    return `${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]!.slice(0, 3)}`
}

// «18 окт» / «ноябрь 2026» / «2027» — куда уехала задача
export function movedLabel(t: PlanTaskItem): string {
    const m = t.movedTo
    if (!m) return 'копия удалена'
    switch (m.scope) {
        case 'DAY': return dayShort(m.periodStart)
        case 'WEEK': return m.day ? dayShort(m.day) : `неделя ${dayShort(m.periodStart)}`
        case 'MONTH': {
            const d = parseISO(m.periodStart)
            return `${MONTHS[d.getUTCMonth()]!.toLowerCase()} ${d.getUTCFullYear()}`
        }
        case 'YEAR': return m.periodStart.slice(0, 4)
        case 'TWO_YEARS':
        case 'THREE_YEARS': {
            const key = periodKeyFor(SCOPE_KEY[m.scope], m.periodStart)
            return key.replace('-', '–')
        }
    }
}

export function movedHref(t: PlanTaskItem): string | null {
    const m = t.movedTo
    if (!m) return null
    const key = SCOPE_KEY[m.scope]
    return `/plan/${key}/${periodKeyFor(key, m.periodStart)}`
}

export interface PlanStats {
    total: number
    done: number
    partial: number
    todo: number
    moved: number
}

export function planStats(tasks: PlanTaskItem[]): PlanStats {
    const s: PlanStats = {total: tasks.length, done: 0, partial: 0, todo: 0, moved: 0}
    for (const t of tasks) {
        if (t.movedAt) s.moved++
        else if (t.status === 'DONE') s.done++
        else if (t.status === 'PARTIAL') s.partial++
        else s.todo++
    }
    return s
}

export const percentOf = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0)