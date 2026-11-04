import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
  await authCheck(event)
  await permissionCheck('article:deletePermanent')(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

  const article = await prisma.article.findUnique({
    where: { id },
    select: { id: true, status: true }
  })
  if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

  if (article.status !== 'ARCHIVED') {
    throw createError({
      statusCode: 409,
      message: 'Безвозвратно удалить можно только статью из архива'
    })
  }

  await prisma.article.delete({ where: { id } })
  return { ok: true }
})
