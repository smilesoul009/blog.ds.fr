export interface SpaceListItem {
    id: string
    name: string
    description: string | null
    coverUrl: string | null
    owner: { id: string; firstName: string | null; lastName: string | null }
    _count: { articles: number; users: number; accessLinks: number }
}

export function ownerName(space: SpaceListItem) {
    return [space.owner.firstName, space.owner.lastName].filter(Boolean).join(' ') || 'Владелец'
}