import { z } from 'zod'
import { prisma } from '#server/db/client'
import { defineCrud } from '#server/utils/defineCrud'
import { authCheck, permissionCheck } from '#server/utils/checks'
import { hasPermission } from '~~/shared/constants/permissions'
import { findCoverUrl } from '#server/utils/articlePreview'

const createSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional().nullable()
})

const updateSchema = createSchema.partial()

export const spaceController = defineCrud({
  model: prisma.space,
  label: 'Подборки',
  notFoundMessage: 'Подборки не найдены',
  singular: 'space',
  createSchema,
  updateSchema,
  include: {
    owner: { select: { id: true, firstName: true, lastName: true } },
    _count: { select: { articles: true, users: true, accessLinks: true } },
    articles: {
      orderBy: { position: 'asc' },
      take: 1,
      select: { article: { select: { content: true } } },
    },
  },
  searchFields: ['name', 'description'],
  defaultSort: { field: 'name' },
  buildWhere: (query, event) => {
    const user = event.context.user
    if (user && hasPermission(user.roles, 'space:manageAny')) return {}
    return {
      OR: [
        { ownerId: event.context.userId },
        { users: { some: { userId: event.context.userId } } }
      ]
    }
  },
  transformCreate: (data, event) => ({ ...data, ownerId: event.context.userId }),
  checks: {
    list: [authCheck, permissionCheck('space:create')],
    detail: [authCheck],
    create: [authCheck, permissionCheck('space:create')],
    update: [authCheck],
    delete: [authCheck]
  },
  audit: { entityType: 'Space', nameField: 'name' },
  transformOutput: (data: any) => {
    const toItem = ({ articles, ...rest }: any) => ({
      ...rest,
      coverUrl: findCoverUrl(articles?.[0]?.article?.content),
    })
    return Array.isArray(data?.items)
        ? { ...data, items: data.items.map(toItem) }
        : toItem(data)
  },
})
