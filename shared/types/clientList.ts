export interface ClientListItem {
    id: string
    username: string
    email: string
    firstName: string | null
    lastName: string | null
    createdAt: string
    isMine: boolean
    myComment: string | null
    deletionRequestedAt: string | null
    readCount: number
    _count: { clientLibrary: number }
}