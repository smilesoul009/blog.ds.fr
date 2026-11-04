import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
  await authCheck(event)

  const user = await prisma.user.findUnique({
    where: { id: event.context.userId },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      roles: true,
      createdAt: true
    }
  })
  if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

  // В режиме просмотра сообщаем, кто на самом деле смотрит и до какого времени
  let viewAs = null
  if (event.context.readOnly) {
    const admin = await prisma.user.findUnique({
      where: { id: event.context.realUserId },
      select: { firstName: true, lastName: true, username: true },
    })
    viewAs = {
      adminName: [admin?.firstName, admin?.lastName].filter(Boolean).join(' ') || admin?.username || '',
      expiresAt: event.context.viewAsExpiresAt,
    }
  }

  return { ...user, viewAs }
})
