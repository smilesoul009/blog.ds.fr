import { prisma } from '#server/db/client'
import bcrypt from 'bcryptjs'
import { signJWT } from '#server/utils/jwt'

const userSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  roles: true,
  createdAt: true
} as const

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Логин и пароль обязательны' })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    throw createError({ statusCode: 401, message: 'Неверный логин или пароль' })
  }

  if (!user.isActive) {
    throw createError({ statusCode: 403, message: 'Учётная запись отключена' })
  }

  setCookie(event, 'auth_token', signJWT({ userId: user.id }), {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  writeAudit({
    action: 'LOGIN',
    entityType: 'User',
    entityId: user.id,
    entityName: user.username,
    userId: user.id,
  })

  if (user.deletionRequestedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: null },
    })

    writeAudit({
      action: 'RESTORE',
      entityType: 'User',
      entityId: user.id,
      entityName: user.username,
      userId: user.id,
    })
  }


  const { passwordHash, updatedAt, ...safeUser } = user
  return safeUser
})
