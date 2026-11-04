import type {NotifySettings} from '~~/shared/constants/notifications'
import {
    addDays, mondayOf, periodKeyFor, periodStartISO, shiftPeriod, timeToMin, type PlanScopeKey,
} from '~~/shared/utils/planDates'

// Окно «догоняния»: если в нужную минуту сервер был недоступен, напоминание придёт в течение часа
export const REMINDER_WINDOW_MIN = 60

// День, в который нужно напомнить об итогах периода, содержащего дату today
export function reviewTriggerDate(
    scope: PlanScopeKey,
    today: string,
    rule: { weekday?: number; daysBefore?: number },
): { periodKey: string; date: string } {
    if (scope === 'day') return {periodKey: today, date: today}

    if (scope === 'week') {
        const monday = mondayOf(today)
        return {periodKey: monday, date: addDays(monday, (rule.weekday ?? 7) - 1)}
    }

    // Месяц и годы: за N дней до начала следующего периода (1 — последний день периода)
    const key = periodKeyFor(scope, today)
    const start = periodStartISO(scope, key)
    const nextStart = periodStartISO(scope, shiftPeriod(scope, key, 1))
    const date = addDays(nextStart, -(rule.daysBefore ?? 1))
    return {periodKey: key, date: date < start ? start : date}
}

// Какие напоминания об итогах пора отправить «сейчас» (дата и минуты — по часам пользователя)
export function dueReviewReminders(
    settings: NotifySettings,
    now: { date: string; minutes: number },
): Array<{ scope: PlanScopeKey; periodKey: string }> {
    const due: Array<{ scope: PlanScopeKey; periodKey: string }> = []
    for (const [scope, rule] of Object.entries(settings.periods) as [PlanScopeKey, NotifySettings['periods'][PlanScopeKey]][]) {
        if (!rule.enabled) continue
        const at = timeToMin(rule.time)
        if (at == null) continue
        const {periodKey, date} = reviewTriggerDate(scope, now.date, rule)
        if (date === now.date && now.minutes >= at && now.minutes < at + REMINDER_WINDOW_MIN) {
            due.push({scope, periodKey})
        }
    }
    return due
}
