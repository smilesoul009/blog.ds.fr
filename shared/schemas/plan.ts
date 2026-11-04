import {z} from 'zod'
import {PLAN_SCOPE_KEYS} from '~~/shared/utils/planDates'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Неверная дата')
const minutes = z.number().int().min(0).max(1440)

const base = z.object({
    title: z.string().trim().min(1, 'Название обязательно').max(300, 'Слишком длинное название'),
    description: z.string().max(5000, 'Слишком длинное описание').nullable().optional(),
    comment: z.string().max(2000, 'Слишком длинный комментарий').nullable().optional(),
    day: isoDate.nullable().optional(),
    startMin: minutes.nullable().optional(),
    endMin: minutes.nullable().optional(),
})

// Все периоды плана: 3 года, 2 года, год, месяц, неделя, день
export const planScopeSchema = z.enum(PLAN_SCOPE_KEYS)

export const planCreateSchema = base.extend({
    scope: planScopeSchema,
    period: z.string(),
})

export const planUpdateSchema = base.partial().extend({
    status: z.enum(['TODO', 'DONE', 'PARTIAL']).optional(),
})

export const planReorderSchema = z.object({
    scope: planScopeSchema,
    period: z.string(),
    ids: z.array(z.string()).max(500),
    moved: z.object({
        id: z.string(),
        status: z.enum(['TODO', 'DONE', 'PARTIAL']),
    }).optional(),
})
