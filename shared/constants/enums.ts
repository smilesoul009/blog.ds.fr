import type { Role, ArticleStatus, BlockReviewStatus } from '@prisma/client'

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Администратор',
  EDITOR: 'Редактор',
  AUTHOR: 'Автор',
  CLIENT: 'Клиент'
}

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: 'Черновик',
  REVIEW: 'На проверке',
  READY: 'Готова',
  ARCHIVED: 'Архив'
}

export const ARTICLE_STATUS_COLORS: Record<ArticleStatus, string> = {
  DRAFT: 'neutral',
  REVIEW: 'neutral',
  READY: 'neutral',
  ARCHIVED: 'neutral'
}

export const BLOCK_REVIEW_LABELS: Record<BlockReviewStatus, string> = {
  APPROVED: 'Одобрено',
  REJECTED: 'Отклонено'
}

export function toOptions<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map(value => ({ value, label: labels[value] }))
}
