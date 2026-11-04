import {addDays, mondayOf, periodKeyFor, type PlanScopeKey} from '~~/shared/utils/planDates'

// «Временные» (2.1): годы и виды периода в меню «Плана», адреса экранов выбора и списков.
// Год → сразу список года; Месяц, Неделя, День, Еженедельный план → сначала календарь года (/plan/time/<год>/<вид>)

export const PLAN_YEARS_AHEAD = 4    // в меню — текущий год и столько следующих

export const TIME_KINDS = ['year', 'month', 'week', 'day', 'weekly'] as const
export type TimeKind = typeof TIME_KINDS[number]
export type PickKind = Exclude<TimeKind, 'year'>      // виды с экраном выбора
export const PICK_KINDS: PickKind[] = ['month', 'week', 'day', 'weekly']

export const TIME_LABEL: Record<TimeKind, string> = {
    year: 'Год', month: 'Месяц', week: 'Неделя', day: 'День', weekly: 'Еженедельный план',
}

// Что выбирается в календаре года для вида
export const PICK_MODE: Record<PickKind, 'day' | 'week' | 'month'> = {month: 'month', week: 'week', day: 'day', weekly: 'week'}
export const PICK_WHAT: Record<PickKind, string> = {month: 'месяц', week: 'неделю', day: 'день', weekly: 'неделю'}
export const PICK_CURRENT: Record<PickKind, string> = {
    month: 'Текущий месяц', week: 'Текущая неделя', day: 'Сегодня', weekly: 'Текущая неделя',
}

export const isPickKind = (v: unknown): v is PickKind => typeof v === 'string' && (PICK_KINDS as string[]).includes(v)
export const isPlanYear = (v: unknown): boolean => typeof v === 'string' && /^\d{4}$/.test(v)

// Годы в меню: текущий и PLAN_YEARS_AHEAD следующих; открытый год вне этого ряда добавляется, чтобы был виден
export function planYears(todayIso: string, open?: number | null): number[] {
    const now = Number(todayIso.slice(0, 4))
    const years = Array.from({length: PLAN_YEARS_AHEAD + 1}, (_, i) => now + i)
    if (open && !years.includes(open)) years.push(open)
    return years.sort((a, b) => a - b)
}

// Ключ текущего периода для вида: 2026-10 / понедельник недели / сегодня / 2026
export function currentKey(kind: TimeKind, todayIso: string): string {
    if (kind === 'weekly') return periodKeyFor('week', todayIso)
    return periodKeyFor(kind as PlanScopeKey, todayIso)
}

// Адрес пункта меню вида периода и адрес списка выбранного периода
export const kindPath = (year: number, kind: TimeKind) => (kind === 'year' ? `/plan/year/${year}` : `/plan/time/${year}/${kind}`)
export const listPath = (kind: TimeKind, key: string) => (kind === 'weekly' ? `/plan/weekly/${key}` : `/plan/${kind}/${key}`)

// Год и вид по адресу — чтобы меню подсвечивало, где вы сейчас (в том числе на списках и сетке недели).
// Неделя относится к году своего четверга (как номер недели по ISO)
export function timeFromPath(path: string): { year: number | null; kind: TimeKind | null } {
    const parts = path.split('/').filter(Boolean)       // ['plan', …]
    if (parts[0] !== 'plan') return {year: null, kind: null}
    const [, a, b, c] = parts
    if (a === 'time') {
        const year = isPlanYear(b) ? Number(b) : null
        return {year, kind: year && isPickKind(c) ? c : null}
    }
    if (!b) return {year: null, kind: null}
    const year = /^\d{4}/.test(b) ? Number(b.slice(0, 4)) : null
    if (a === 'year' || a === 'month' || a === 'day') return {year, kind: a}
    if (a === 'week' || a === 'weekly') return {year: /^\d{4}-\d{2}-\d{2}$/.test(b) ? Number(addDays(mondayOf(b), 3).slice(0, 4)) : year, kind: a}
    if (a === 'year2' || a === 'year3') return {year, kind: null}
    return {year: null, kind: null}
}
