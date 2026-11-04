import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'
import { diffBlocks } from '#server/utils/articleBlocks'

export default defineEventHandler(async (event) => {
  await authCheck(event)

  const id = getRouterParam(event, 'id')
  const { from: fromId, to: toId } = getQuery(event) as { from?: string, to?: string }

  if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })
  if (!fromId) throw createError({ statusCode: 400, message: 'Не указана ID исходной версии' })

  const fromVersion = await prisma.articleVersion.findFirst({
    where: { id: fromId, articleId: id }
  })
  if (!fromVersion) throw createError({ statusCode: 404, message: 'Исходная версия не найдена' })

  let to: { title: string, content: any, label: string }

  if (!toId || toId === 'current') {
    const article = await prisma.article.findUnique({
      where: { id },
      select: { title: true, content: true, updatedAt: true }
    })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })
    to = { title: article.title, content: article.content, label: 'Текущая версия' }
  } else {
    const toVersion = await prisma.articleVersion.findFirst({
      where: { id: toId, articleId: id }
    })
    if (!toVersion) throw createError({ statusCode: 404, message: 'Версия не найдена' })
    to = { title: toVersion.title, content: toVersion.content, label: `Версия ${toVersion.number}` }
  }

  return {
    from: {
      title: fromVersion.title,
      content: fromVersion.content,
      label: `Версия ${fromVersion.number}`,
      createdAt: fromVersion.createdAt
    },
    to,
    blocks: diffBlocks(fromVersion.content, to.content)
  }
})
