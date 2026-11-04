import {z} from 'zod'
import {daySlotSchema} from '~~/shared/constants/notifications'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Неверная дата')
const title = z.string().trim().min(1, 'Название обязательно').max(300, 'Слишком длинное название')

export const goalRemindSchema = z.object({
    daysBefore: z.number().int().min(1).max(90),
    soonSlot: daySlotSchema,
    daySlot: daySlotSchema,
})

export const goalCreateSchema = z.object({title})

export const goalUpdateSchema = z.object({
    title: title.optional(),
    description: z.string().max(5000, 'Слишком длинное описание').nullable().optional(),
    dueDate: isoDate.nullable().optional(),
    remind: goalRemindSchema.nullable().optional(),
})

export const goalReorderSchema = z.object({
    ids: z.array(z.string()).max(500),
})

export const stepCreateSchema = z.object({title})

export const stepUpdateSchema = z.object({
    title: title.optional(),
    description: z.string().max(5000, 'Слишком длинное описание').nullable().optional(),
    comment: z.string().max(2000, 'Слишком длинный комментарий').nullable().optional(),
    status: z.enum(['TODO', 'DONE', 'PARTIAL']).optional(),
    dueDate: isoDate.nullable().optional(),
    remind: goalRemindSchema.nullable().optional(),
})

export const stepReorderSchema = z.object({
    ids: z.array(z.string()).max(500),
    moved: z.object({
        id: z.string(),
        status: z.enum(['TODO', 'DONE', 'PARTIAL']),
    }).optional(),
})
