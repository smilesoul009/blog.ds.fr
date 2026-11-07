export const PLAN_SCOPE_KEYS = ['year3', 'year2', 'year', 'month', 'week', 'day'] as const

export type PlanScopeKey = typeof PLAN_SCOPE_KEYS[number]

// Кнопки слева в шапке. 2 и 3 года — подвиды года, выбираются справа
export const PLAN_MAIN_SCOPES: PlanScopeKey[] = ['year', 'month', 'week', 'day']
export const PLAN_YEAR_SCOPES: PlanScopeKey[] = ['year', 'year2', 'year3']

export const PLAN_SCOPE_LABELS: Record<PlanScopeKey, string> = {
    year3: '3 года', year2: '2 года', year: 'Год', month: 'Месяц', week: 'Неделя', day: 'День',
}

export const SCOPE_ENUM = {
    year3: 'THREE_YEARS', year2: 'TWO_YEARS', year: 'YEAR', month: 'MONTH', week: 'WEEK', day: 'DAY',
} as const

export type PlanScopeEnum = typeof SCOPE_ENUM[PlanScopeKey]

export const SCOPE_KEY = {
    THREE_YEARS: 'year3', TWO_YEARS: 'year2', YEAR: 'year', MONTH: 'month', WEEK: 'week', DAY: 'day',
} as const

// Длина периода в годах для года и многолетних периодов
export const YEAR_SPAN = {year: 1, year2: 2, year3: 3} as const
type YearScope = keyof typeof YEAR_SPAN

export const isYearScope = (s: PlanScopeKey): s is YearScope => s in YEAR_SPAN

// Кнопка слева, которая подсвечивается: для 2 и 3 лет — «Год»
export const mainScope = (s: PlanScopeKey): PlanScopeKey => (isYearScope(s) ? 'year' : s)

// Многолетние периоды идут по сетке: 2 года — с чётного года (2026–2027),
// 3 года — с года, кратного трём (2025–2027)
export function spanStartYear(year: number, span: number): number {
    return year - (((year % span) + span) % span)
}

const spanKey = (start: number, span: number) => `${start}-${start + span - 1}`

export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
export const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
export const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
    'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
export const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const pad = (n: number) => String(n).padStart(2, '0')

// Даты — строки 'YYYY-MM-DD', считаем в UTC, чтобы не было сдвига на часовой пояс
export function parseISO(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(Date.UTC(y!, m! - 1, d!))
}

export function toISO(d: Date): string {
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

// «Сегодня» — по часам пользователя
export function todayISO(): string {
    const d = new Date()
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDays(iso: string, n: number): string {
    const d = parseISO(iso)
    d.setUTCDate(d.getUTCDate() + n)
    return toISO(d)
}

export function mondayOf(iso: string): string {
    const diff = (parseISO(iso).getUTCDay() + 6) % 7
    return addDays(iso, -diff)
}

export function isValidISODate(iso: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) && toISO(parseISO(iso)) === iso
}

export function isPlanScope(value: unknown): value is PlanScopeKey {
    return typeof value === 'string' && (PLAN_SCOPE_KEYS as readonly string[]).includes(value)
}

// Ключ периода в адресе: 2026 / 2026-10 / 2026-10-12 (понедельник) / 2026-10-14
export function isValidPeriodKey(scope: PlanScopeKey, key: string): boolean {
    switch (scope) {
        case 'year3':
        case 'year2': {
            const m = /^(\d{4})-(\d{4})$/.exec(key)
            if (!m) return false
            const start = Number(m[1])
            return spanStartYear(start, YEAR_SPAN[scope]) === start && key === spanKey(start, YEAR_SPAN[scope])
        }
        case 'year': return /^\d{4}$/.test(key)
        case 'month': return /^\d{4}-(0[1-9]|1[0-2])$/.test(key)
        case 'week': return isValidISODate(key) && mondayOf(key) === key
        case 'day': return isValidISODate(key)
    }
}

export function periodKeyFor(scope: PlanScopeKey, iso: string): string {
    switch (scope) {
        case 'year3':
        case 'year2': {
            const span = YEAR_SPAN[scope]
            return spanKey(spanStartYear(Number(iso.slice(0, 4)), span), span)
        }
        case 'year': return iso.slice(0, 4)
        case 'month': return iso.slice(0, 7)
        case 'week': return mondayOf(iso)
        case 'day': return iso
    }
}

export function periodStartISO(scope: PlanScopeKey, key: string): string {
    switch (scope) {
        case 'year3':
        case 'year2':
        case 'year': return `${key.slice(0, 4)}-01-01`
        case 'month': return `${key}-01`
        default: return key
    }
}

export function shiftPeriod(scope: PlanScopeKey, key: string, delta: number): string {
    switch (scope) {
        case 'year3':
        case 'year2': {
            const span = YEAR_SPAN[scope]
            return spanKey(Number(key.slice(0, 4)) + span * delta, span)
        }
        case 'year': return String(Number(key) + delta)
        case 'month': {
            const d = parseISO(`${key}-01`)
            d.setUTCMonth(d.getUTCMonth() + delta)
            return toISO(d).slice(0, 7)
        }
        case 'week': return addDays(key, 7 * delta)
        case 'day': return addDays(key, delta)
    }
}

function dayMonth(iso: string) {
    const d = parseISO(iso)
    return `${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]}`
}

// Вспомогательный парсер строк вида "YYYY-MM-DD" строго в UTC
function parseKeyToUTCDate(key: string): Date | null {
    const parts = key.split('-').map(Number);
    if (parts.some(isNaN) || parts.length < 2) return null;

    const [year, month, day = 1] = parts;
    return new Date(Date.UTC(year!, month! - 1, day));
}

// Функция для вычисления ISO-номера недели
function getISOWeekNumber(date: Date): number {
    const target = new Date(date.getTime());
    const dayNr = (date.getUTCDay() + 6) % 7; // Понедельник = 0, Воскресенье = 6

    // Устанавливаем дату на четверг текущей недели
    target.setUTCDate(target.getUTCDate() - dayNr + 3);

    const firstThursday = target.getTime();
    // Устанавливаем на 1 января текущего года
    target.setUTCMonth(0, 1);

    // Если 1 января не четверг, ищем следующий четверг
    if (target.getUTCDay() !== 4) {
        target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
    }

    // Разница в неделях между первым четвергом года и четвергом текущей недели
    return 1 + Math.ceil((firstThursday - target.getTime()) / (604800000));
}

// Встроенный инструмент форматирования в строку вида "ДД.ММ.ГГГГ"
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
});

export function periodTitle(scope: PlanScopeKey, key: string): string {
    if (!key) return '';

    switch (scope) {
        case 'year3':
        case 'year2': {
            const startYear = key.slice(0, 4);
            const endYear = key.length >= 9 ? key.slice(5, 9) : '';
            return endYear ? `${startYear} – ${endYear}` : startYear;
        }

        case 'year':
            return `${key.slice(0, 4)} год`;

        case 'month': {
            const [y, m] = key.split('-').map(Number);
            if (!y || !m || m < 1 || m > 12) return key;
            const monthName = MONTHS[m - 1] ?? '';
            return monthName ? `${monthName} ${y}` : key;
        }

        case 'week': {
            const startDate = parseKeyToUTCDate(key);
            if (!startDate) return key;

            // Получаем номер недели
            const weekNumber = getISOWeekNumber(startDate);

            // Прибавляем 6 дней для получения даты конца недели
            const endDate = new Date(startDate.getTime());
            endDate.setUTCDate(endDate.getUTCDate() + 6);

            const endFullDate = dateFormatter.format(endDate);
            const crossesMonth = startDate.getUTCFullYear() !== endDate.getUTCFullYear()
                || startDate.getUTCMonth() !== endDate.getUTCMonth();
            // При переходе месяца или года показываем обе полные даты,
            // иначе «28-03.01.2027» не позволяет определить начало недели.
            const startLabel = crossesMonth
                ? dateFormatter.format(startDate)
                : pad(startDate.getUTCDate());

            return `${weekNumber} неделя, ${startLabel}–${endFullDate}`;
        }

        case 'day': {
            const d = parseKeyToUTCDate(key);
            if (!d) return key;

            const formattedDate = dateFormatter.format(d);
            const weekday = WEEKDAYS[d.getUTCDay()] ?? '';

            return weekday ? `${formattedDate}, ${weekday}` : formattedDate;
        }

        default: {
            const _exhaustiveCheck: never = scope;
            return key;
        }
    }
}



export function minToTime(m?: number | null): string {
    if (m == null) return ''
    return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

export function timeToMin(t?: string | null): number | null {
    if (!t || !/^\d{2}:\d{2}/.test(t)) return null
    const [h, m] = t.slice(0, 5).split(':').map(Number)
    return h! * 60 + m!
}

export function dayLabel(iso: string): string {
    const d = parseISO(iso)
    return `${WEEKDAYS_SHORT[(d.getUTCDay() + 6) % 7]}, ${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]}`
}

// Масштаб недели — shared/utils/planWeek.ts (ячейки по 15 минут)
