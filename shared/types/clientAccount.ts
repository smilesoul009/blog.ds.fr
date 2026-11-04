export interface ClientAccountItem {
    id: string
    username: string
    email: string
    firstName: string | null
    lastName: string | null
    isActive: boolean
    createdAt: string
    deletionRequestedAt: string | null
    avatarUrl: string | null
    _count: { clientLibrary: number; clientMarks: number }
}

export function deletionDate(client: ClientAccountItem) {
    if (!client.deletionRequestedAt) return ''
    const date = new Date(client.deletionRequestedAt)
    date.setDate(date.getDate() + 30)
    return date.toLocaleDateString('ru')
}