import { z } from 'zod'

export const ROLE_VALUES = ['ADMIN', 'EDITOR', 'AUTHOR', 'CLIENT'] as const

export const userCreateSchema = z.object({
    username: z.string().min(3, 'Минимум 3 символа'),
    email: z.email('Некорректный email'),
    password: z.string().min(6, 'Минимум 6 символов'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roles: z.array(z.enum(ROLE_VALUES)).min(1, 'Укажите хотя бы одну роль'),
    isActive: z.boolean().optional(),
})

export const userUpdateSchema = userCreateSchema.partial().extend({
    password: z.string().min(6, 'Минимум 6 символов').optional().or(z.literal('')),
})