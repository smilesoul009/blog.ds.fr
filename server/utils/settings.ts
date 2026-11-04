import { prisma } from '#server/db/client'

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
    const row = await prisma.setting.findUnique({ where: { key } })
    return row ? (row.value as T) : fallback
}

export async function getSettings<T extends Record<string, any>>(
    defaults: T,
    keyMap: Record<keyof T, string>,
): Promise<T> {
    const keys = Object.values(keyMap) as string[]
    const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
    const byKey = new Map(rows.map(r => [r.key, r.value]))

    const result = { ...defaults }
    for (const field of Object.keys(defaults) as (keyof T)[]) {
        const stored = byKey.get(keyMap[field])
        if (stored !== undefined) result[field] = stored as T[keyof T]
    }
    return result
}

export async function setSetting(key: string, value: any) {
    return prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
    })
}