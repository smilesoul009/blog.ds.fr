export const AVATARS = {
    default: '/images/avatar-default.webp',
    female: '/images/avatar-female.webp',
    male: '/images/avatar-male.webp',
} as const

// Пока пола нет — всем нейтральная. Позже: по полю gender.
export function avatarFor(user?: { avatarUrl?: string | null } | null) {
    return user?.avatarUrl || AVATARS.default
}