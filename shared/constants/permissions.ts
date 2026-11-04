import type {Role} from '@prisma/client'

export const PERMISSIONS = [
    'article:create',
    'article:editOwn',
    'article:editAny',
    'article:archiveAny',
    'article:deletePermanent',
    'article:review',
    'article:publish',
    'space:create',
    'space:manageAny',
    'user:manage',
    'user:viewAs',
    'area:manage',
    'audit:view',
    'audit:restore',
    'wallpaper:manage',
    'settings:manage',
    'client:manage',
    'article:markStarter',
    'article:block',
    'plan:use'
] as const

export type Permission = typeof PERMISSIONS[number]

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
    CLIENT: [],
    AUTHOR: [
        'article:create',
        'article:editOwn',
        'space:create',
        'client:manage',
        'plan:use'
    ],
    EDITOR: [
        'article:create',
        'article:editOwn',
        'article:editAny',
        'article:review',
        'article:publish',
        'space:create',
        'client:manage',
        'plan:use'
    ],
    ADMIN: PERMISSIONS
}

export function permissionsFor(roles: Role[]): Set<Permission> {
    const result = new Set<Permission>()
    for (const role of roles) {
        for (const p of ROLE_PERMISSIONS[role] ?? []) result.add(p)
    }
    return result
}

export function hasPermission(roles: Role[], permission: Permission): boolean {
    return permissionsFor(roles).has(permission)
}
