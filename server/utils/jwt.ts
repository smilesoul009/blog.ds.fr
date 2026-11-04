import jwt from 'jsonwebtoken'

export interface JWTPayload {
  userId: string
}

function getSecret(): string {
  const secret = process.env.NUXT_JWT_SECRET || process.env.JWT_SECRET
  if (!secret) throw new Error('Не задан секрет для JWT')
  return secret
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JWTPayload
  } catch {
    return null
  }
}

export interface ViewAsPayload {
  adminId: string
  targetId: string
  exp?: number
}

/** Метка «администратор смотрит сайт как пользователь», живёт час */
export function signViewAs(payload: { adminId: string; targetId: string }): string {
  return jwt.sign({ ...payload, kind: 'viewAs' }, getSecret(), { expiresIn: '1h' })
}

export function verifyViewAs(token: string): ViewAsPayload | null {
  try {
    const data = jwt.verify(token, getSecret()) as any
    return data?.kind === 'viewAs' ? data : null
  } catch {
    return null
  }
}