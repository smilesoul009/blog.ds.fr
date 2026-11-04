import type { AuditAction } from '@prisma/client'

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
    CREATE: 'Создание',
    UPDATE: 'Изменение',
    DELETE: 'Удаление',
    RESTORE: 'Восстановление',
    STATUS_CHANGE: 'Смена статуса',
    LOGIN: 'Вход',
    BLOCK: 'Блокировка',
    UNBLOCK: 'Снятие блокировки',
    VIEW_AS: 'Просмотр как пользователь',
}

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
    CREATE: 'success',
    UPDATE: 'info',
    DELETE: 'error',
    RESTORE: 'warning',
    STATUS_CHANGE: 'neutral',
    LOGIN: 'neutral',
    BLOCK: 'neutral',
    UNBLOCK: 'neutral',
    VIEW_AS: 'neutral',
}