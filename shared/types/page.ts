export interface PageTab {
    value: string
    label: string
    icon?: string
    disabled?: boolean
    badge?: string | number
    footer?: boolean
    card?: boolean
}