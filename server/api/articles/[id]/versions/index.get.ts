import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
  await authCheck(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

  return prisma.articleVersion.findMany({
    where: { articleId: id },
    orderBy: { number: 'desc' },
    select: {
      id: true,
      number: true,
      title: true,
      reason: true,
      createdAt: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } }
    }
  })
})
