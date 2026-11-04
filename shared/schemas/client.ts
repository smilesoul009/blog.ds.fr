import { z } from 'zod'

export const clientRegisterSchema = z.object({
    username: z.string().min(3, 'Минимум 3 символа'),
    email: z.email('Некорректный email'),
    password: z.string().min(6, 'Минимум 6 символов'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    token: z.string().optional(),
})