import bcrypt from 'bcryptjs'
import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'
import { passwordChangeSchema } from '~~/shared/schemas/profile'
import {writeAudit} from "#server/utils/audit.ts";

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const userId = event.context.userId
    const { currentPassword, newPassword } = passwordChangeSchema.parse(await readBody(event))

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
    })
    if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw createError({ statusCode: 403, message: 'Текущий пароль неверный' })

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    })

    return { ok: true }
})