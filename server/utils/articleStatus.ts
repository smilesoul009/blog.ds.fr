import {ArticleStatus, PrismaClient, VersionReason} from '@prisma/client'
import { createError } from 'h3'
import { prisma } from '#server/db/client'
import { hasPermission, type Permission } from '~~/shared/constants/permissions'

interface Transition {
  from: ArticleStatus[]
  permission?: Permission
  authorAllowed: boolean
  requiresApproval?: boolean
  versionReason?: VersionReason
}

export const TRANSITIONS: Record<ArticleStatus, Transition> = {
  DRAFT: {
    from: ['REVIEW', 'READY', 'ARCHIVED'],
    authorAllowed: true,
    versionReason: VersionReason.RETURNED_TO_AUTHOR
  },
  REVIEW: {
    from: ['DRAFT'],
    authorAllowed: true,
    versionReason: VersionReason.SUBMITTED_FOR_REVIEW
  },
  READY: {
    from: ['REVIEW', 'DRAFT'],
    permission: 'article:publish',
    authorAllowed: true,
    requiresApproval: false,
    versionReason: VersionReason.PUBLISHED
  },
  ARCHIVED: {
    from: ['DRAFT', 'REVIEW', 'READY'],
    authorAllowed: true
  }
}

export async function createVersion(
  tx: PrismaClient | any,
  article: { id: string, title: string, content: any },
  reason: VersionReason,
  userId: string
) {
  const last = await tx.articleVersion.findFirst({
    where: { articleId: article.id },
    orderBy: { number: 'desc' },
    select: { number: true }
  })

  return tx.articleVersion.create({
    data: {
      articleId: article.id,
      number: (last?.number ?? 0) + 1,
      title: article.title,
      content: article.content,
      reason,
      createdById: userId
    }
  })
}

export function assertTransitionAllowed(
    from: ArticleStatus,
    to: ArticleStatus,
    opts: { isAuthor: boolean; isAreaOwner: boolean; roles: any[] },
) {
  const rule = TRANSITIONS[to]
  if (!rule) throw createError({ statusCode: 400, message: 'Неизвестный статус' })

  if (from === to) {
    throw createError({ statusCode: 409, message: 'Статья уже в этом статусе' })
  }

  if (!rule.from.includes(from)) {
    throw createError({
      statusCode: 409,
      message: `Переход из «${from}» в «${to}» невозможен`,
    })
  }

  const byPermission = rule.permission && hasPermission(opts.roles, rule.permission)
  const byAuthorship = rule.authorAllowed && opts.isAuthor
  const byAreaOwner = rule.authorAllowed && opts.isAreaOwner
  const byAdmin = hasPermission(opts.roles, 'article:editAny')

  if (!byPermission && !byAuthorship && !byAreaOwner && !byAdmin) {
    throw createError({ statusCode: 403, message: 'Недостаточно прав для смены статуса' })
  }

  return rule
}
