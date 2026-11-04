import { z } from 'zod'
import { prisma } from '#server/db/client'
import { defineCrud } from '#server/utils/defineCrud'
import { authCheck, permissionCheck } from '#server/utils/checks'
import {hasPermission} from "#shared/constants/permissions.ts";

const createSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional().nullable()
})

const updateSchema = createSchema.partial()

export const areaController = defineCrud({
  model: prisma.area,
  label: 'Направления',
  notFoundMessage: 'Направление не найдено',
  singular: 'area',
  createSchema,
  updateSchema,
  buildWhere: (query, event) => {
    const user = event.context.user
    if (user && hasPermission(user.roles, 'area:manage')) return {}

    return {
      OR: [
        { ownerId: event.context.userId },
        { users: { some: { userId: event.context.userId } } },
      ],
    }
  },
  include: {
    owner: { select: { id: true, firstName: true, lastName: true, username: true } },
    _count: { select: { articles: true, users: true } },
  },
  searchFields: ['name'],
  defaultSort: { field: 'name' },
  relations: ['article', 'userArea'],
  checks: {
    list: [authCheck],
    detail: [authCheck],
    create: [authCheck, permissionCheck('area:manage')],
    update: [authCheck, permissionCheck('area:manage')],
    delete: [authCheck, permissionCheck('area:manage')]
  },
  audit: { entityType: 'Area', nameField: 'name' },
})
