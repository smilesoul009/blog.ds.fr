import type {Role} from '@prisma/client'

export interface UserListItem {
    id: string
    username: string
    email: string
    firstName: string | null
    lastName: string | null
    roles: Role[]
    isActive: boolean
    createdAt: string
}

export function userFullName(u: Pick<UserListItem, 'firstName' | 'lastName' | 'username'>) {
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username
}