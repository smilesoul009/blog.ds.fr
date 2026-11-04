import type { Role } from '@prisma/client'

export interface AuthUser {
  id: string
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  isActive: boolean
  roles: Role[]
  createdAt: string | Date
  viewAs?: { adminName: string; expiresAt: number } | null
}
