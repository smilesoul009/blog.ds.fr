import type { AuditAction } from '@prisma/client'
import { prisma } from '#server/db/client'

interface WriteAuditParams {
    action: AuditAction
    entityType: string
    entityId: string
    entityName?: string | null
    snapshot?: any
    changes?: any
    userId?: string | null
}

export function writeAudit(params: WriteAuditParams) {
    return prisma.auditLog
        .create({
            data: {
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                entityName: params.entityName ?? null,
                snapshot: params.snapshot ?? undefined,
                changes: params.changes ?? undefined,
                userId: params.userId ?? null,
            },
        })
        .catch((e: any) => {
            console.error('Не удалось записать в журнал', e)
        })
}

const IGNORED_KEYS = ['updatedAt', 'createdAt', 'passwordHash']

export function computeChanges(before: any, after: any) {
    const changes: Record<string, { from: any; to: any }> = {}

    for (const key of Object.keys(after ?? {})) {
        if (IGNORED_KEYS.includes(key)) continue
        if (typeof after[key] === 'object' && after[key] !== null) continue

        if (before?.[key] !== after[key]) {
            changes[key] = { from: before?.[key] ?? null, to: after[key] }
        }
    }

    return Object.keys(changes).length ? changes : null
}