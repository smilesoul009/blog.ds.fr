import { z } from 'zod'
import slugify from 'slugify'
import { prisma } from '#server/db/client'
import { defineCrud } from '#server/utils/defineCrud'
import {authCheck, permissionCheck, canEditArticle, areaMemberCheck, canViewArticle} from '#server/utils/checks'
import {hasPermission} from "#shared/constants/permissions.ts";
import { findCoverUrl, makeExcerpt } from '#server/utils/articlePreview'

const baseSchema = z.object({
  title: z.string().min(1, 'Заголовок обязателен'),
  slug: z.string().optional(),
  content: z.any(),
  plainText: z.string().optional(),
  images: z.any().optional(),
  areaId: z.string().min(1, 'Направление обязательно')
})

const createSchema = baseSchema
const updateSchema = baseSchema.partial().omit({ areaId: true }).extend({
  areaId: z.string().min(1).optional()
})

function withSlug(body: any) {
  const result = { ...body }
  if (!result.slug && result.title) {
    result.slug = slugify(result.title, { lower: true, strict: true, locale: 'ru' })
  }
  return result
}

const BLOCK_PRIVATE_FIELDS = ['blockReason', 'blockReply', 'blockReplyAt', 'blockReplyById', 'blockedById'] as const

function stripBlockFields(item: any) {
  if (!item || typeof item !== 'object') return item
  const copy = { ...item }
  for (const key of BLOCK_PRIVATE_FIELDS) delete copy[key]
  return copy
}

function toListItem(item: any) {
  const { content, plainText, images, ...rest } = stripBlockFields(item)
  return {
    ...rest,
    coverUrl: findCoverUrl(content),
    excerpt: makeExcerpt(content, 140),
  }
}

export const articleController = defineCrud({
  model: prisma.article,
  singular: 'article',
  label: 'Статьи',
  notFoundMessage: 'Статья не найдена',
  createSchema,
  updateSchema,
  include: {
    area: { select: { id: true, name: true } },
    authors: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
    spaces: { select: { spaceId: true } },
    _count: { select: { reviews: true } },
  },
  allowedFilters: ['areaId', 'status'],
  searchFields: ['title', 'plainText'],
  defaultSort: { field: 'updatedAt', direction: 'desc' },
  buildWhere: (query, event) => {
    const where: any = {}

    if (query.status) {
      where.status = query.status
    } else {
      where.status = { not: 'ARCHIVED' }
    }

    if (query.spaceId === 'null') {
      where.spaces = { none: {} }
    } else if (query.spaceId) {
      where.spaces = { some: { spaceId: query.spaceId } }
    }

    if (query.mine === 'true') {
      where.authors = { some: { userId: event.context.userId } }
    }

    const user = event.context.user
    if (!user || !hasPermission(user.roles, 'article:editAny')) {
      where.area = {
        OR: [
          { ownerId: event.context.userId },
          { users: { some: { userId: event.context.userId } } },
        ],
      }
    }

    return where
  },
  preTransform: withSlug,
  transformCreate: (data, event) => ({
    ...data,
    authors: { create: [{ userId: event.context.userId }] }
  }),
  checks: {
    list: [authCheck],
    detail: [authCheck, canViewArticle()],
    create: [authCheck, permissionCheck('article:create'), areaMemberCheck()],
    update: [authCheck, canEditArticle()],
  },
  audit: { entityType: 'Article', nameField: 'title', actions: ['CREATE'] },
  transformOutput: (data) =>
      Array.isArray(data?.items)
          ? { ...data, items: data.items.map(toListItem) }   // список
          : stripBlockFields(data),
})
