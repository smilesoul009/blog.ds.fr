import { z } from 'zod'

export const profileUpdateSchema = z.object({
    email: z.email('Некорректный email'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
})

export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z.string().min(6, 'Минимум 6 символов'),
})

export const accountDeleteSchema = z.object({
    password: z.string().min(1, 'Введите пароль'),
})