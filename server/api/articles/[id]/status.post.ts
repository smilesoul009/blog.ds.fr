import { z } from 'zod'
import { ArticleStatus } from '@prisma/client'
import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'
import { assertTransitionAllowed, createVersion } from '#server/utils/articleStatus'
import { getUnapprovedBlocks } from '#server/utils/articleBlocks'

const bodySchema = z.object({
  status: z.enum(ArticleStatus),
  comment: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await authCheck(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

  const { status: to, comment } = bodySchema.parse(await readBody(event))
  const userId = event.context.userId
  const user = event.context.user

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      authors: { select: { userId: true } },
      area: { select: { ownerId: true } },}
  })
  if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

  const isAuthor = article.authors.some(a => a.userId === userId)
  const isAreaOwner = article.area.ownerId === userId

  const rule = assertTransitionAllowed(article.status, to, {
    isAuthor,
    isAreaOwner,
    roles: user.roles
  })

  if (rule.requiresApproval) {
    const unapproved = await getUnapprovedBlocks(article.id, article.content)
    if (unapproved.length) {
      throw createError({
        statusCode: 409,
        message: `Не согласовано блоков: ${unapproved.length}`,
        data: { unapproved: unapproved.map(b => b.blockId) }
      })
    }
  }

  return prisma.$transaction(async (tx) => {
    if (rule.versionReason) {
      await createVersion(tx, article, rule.versionReason, userId)
    }

    await tx.articleStatusLog.create({
      data: {
        articleId: article.id,
        fromStatus: article.status,
        toStatus: to,
        comment: comment ?? null,
        userId
      }
    })

    return tx.article.update({
      where: { id: article.id },
      data: {
        status: to,
        archivedAt: to === 'ARCHIVED' ? new Date() : null,
        publishedAt: to === 'READY' && !article.publishedAt ? new Date() : article.publishedAt
      }
    })
  })
})

