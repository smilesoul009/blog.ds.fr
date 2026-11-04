import {z} from 'zod'
import {PLAN_SCOPE_KEYS, type PlanScopeKey} from '~~/shared/utils/planDates'

// ── Напоминания по периодам ──
// День — каждый день в указанное время.
// Неделя — в выбранный день недели (1 — понедельник … 7 — воскресенье) в указанное время.
// Месяц и годы — за N дней до конца периода в указанное время (1 — в последний день периода).

export interface PeriodReminder {
    enabled: boolean
    time: string          // 'HH:MM' по часам пользователя
    weekday?: number      // только неделя
    daysBefore?: number   // месяц и годы
}

// ── Время дня для напоминаний: утро, день, вечер (часы — в настройках) ──
export type DaySlot = 'morning' | 'noon' | 'evening'
export const DAY_SLOTS: DaySlot[] = ['morning', 'noon', 'evening']
export const DAY_SLOT_LABEL: Record<DaySlot, string> = {morning: 'Утро', noon: 'День', evening: 'Вечер'}
export const DAY_SLOT_ICON: Record<DaySlot, string> = {
    morning: 'i-lucide-sunrise',
    noon: 'i-lucide-sun',
    evening: 'i-lucide-sunset',
}

// ── Сроки целей и этапов ──
// Скоро срок — за N дней; в день срока; просрочено — на следующий день. У каждого своё время дня
export interface GoalDueSettings {
    slots: Record<DaySlot, string>                              // 'HH:MM'
    soon: { enabled: boolean; daysBefore: number; slot: DaySlot }
    due: { enabled: boolean; slot: DaySlot }
    overdue: { enabled: boolean; slot: DaySlot }
}

export interface NotifySettings {
    periods: Record<PlanScopeKey, PeriodReminder>
    goals: GoalDueSettings
}

export const DEFAULT_NOTIFY_SETTINGS: NotifySettings = {
    periods: {
        day: {enabled: true, time: '21:00'},
        week: {enabled: true, time: '20:00', weekday: 7},
        month: {enabled: true, time: '20:00', daysBefore: 1},
        year: {enabled: true, time: '20:00', daysBefore: 7},
        year2: {enabled: true, time: '20:00', daysBefore: 7},
        year3: {enabled: true, time: '20:00', daysBefore: 7},
    },
    goals: {
        slots: {morning: '09:00', noon: '12:00', evening: '18:00'},
        soon: {enabled: true, daysBefore: 3, slot: 'morning'},
        due: {enabled: true, slot: 'morning'},
        overdue: {enabled: true, slot: 'morning'},
    },
}

// Порядок в настройках — от дня к трём годам
export const NOTIFY_SCOPE_ORDER: PlanScopeKey[] = ['day', 'week', 'month', 'year', 'year2', 'year3']

export const WEEKDAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Неверное время')

const reminderSchema = z.object({
    enabled: z.boolean(),
    time,
    weekday: z.number().int().min(1).max(7).optional(),
    daysBefore: z.number().int().min(1).max(90).optional(),
})

export const daySlotSchema = z.enum(['morning', 'noon', 'evening'])

const goalDueSettingsSchema = z.object({
    slots: z.object({morning: time, noon: time, evening: time}),
    soon: z.object({enabled: z.boolean(), daysBefore: z.number().int().min(1).max(90), slot: daySlotSchema}),
    due: z.object({enabled: z.boolean(), slot: daySlotSchema}),
    overdue: z.object({enabled: z.boolean(), slot: daySlotSchema}),
})

export const notifySettingsSchema = z.object({
    periods: z.object(Object.fromEntries(PLAN_SCOPE_KEYS.map(k => [k, reminderSchema])) as
        Record<PlanScopeKey, typeof reminderSchema>),
    goals: goalDueSettingsSchema,
})

// Сохранённые настройки поверх умолчаний: недостающее берём из умолчаний
export function mergeNotifySettings(saved: unknown): NotifySettings {
    const result: NotifySettings = structuredClone(DEFAULT_NOTIFY_SETTINGS)
    const raw = saved as { periods?: Record<string, Partial<PeriodReminder>>; goals?: Record<string, unknown> } | null
    const periods = raw?.periods
    if (periods) {
        for (const key of PLAN_SCOPE_KEYS) {
            const parsed = reminderSchema.partial().safeParse(periods[key])
            if (parsed.success) result.periods[key] = {...result.periods[key], ...parsed.data}
        }
    }
    // Сроки целей: каждую часть берём, только если она целиком верная
    const goals = raw?.goals
    if (goals) {
        const shape = goalDueSettingsSchema.shape
        for (const key of Object.keys(shape) as (keyof GoalDueSettings)[]) {
            const parsed = shape[key].safeParse(goals[key])
            if (parsed.success) (result.goals as any)[key] = parsed.data
        }
    }
    return result
}

// Проверка часового пояса: IANA-имя, которое знает Intl
export function isValidTimeZone(tz: unknown): tz is string {
    if (typeof tz !== 'string' || !tz || tz.length > 64) return false
    try {
        new Intl.DateTimeFormat('en-US', {timeZone: tz})
        return true
    } catch {
        return false
    }
}

// Дата и минуты суток «сейчас» в часовом поясе пользователя
export function zonedNow(tz: string, now = new Date()): { date: string; minutes: number } {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).formatToParts(now).map(p => [p.type, p.value]),
    )
    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        minutes: Number(parts.hour) * 60 + Number(parts.minute),
    }
}

// ── Виды уведомлений: подпись и значок ──
export const NOTIFICATION_TYPES: Record<string, { label: string; icon: string; action?: string }> = {
    'plan:review': {label: 'Итоги', icon: 'i-lucide-clipboard-check', action: 'Открыть итоги'},
    'goal:due': {label: 'Сроки целей', icon: 'i-lucide-target', action: 'Открыть цели'},
    'trash:purge': {label: 'Удалённые', icon: 'i-lucide-replace', action: 'Открыть удалённые'},
    test: {label: 'Проверка', icon: 'i-lucide-bell', action: 'Открыть настройки'},
}

export const notificationType = (type: string) =>
    NOTIFICATION_TYPES[type] ?? {label: 'Уведомление', icon: 'i-lucide-bell', action: 'Перейти'}
