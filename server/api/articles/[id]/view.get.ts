import { prisma } from '#server/db/client'
import { authCheck, canViewArticle } from '#server/utils/checks'
import { renderArticleHtml } from '#server/utils/renderArticle'
import { hasPermission } from '~~/shared/constants/permissions'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await canViewArticle()(event)   // кладёт в context статью с авторами и владельцем направления

    const userId = event.context.userId
    const user = event.context.user
    const access = event.context.article   // authors[].userId, area.ownerId

    const article = await prisma.article.findUnique({
        where: { id: access.id },
        select: {
            id: true,
            title: true,
            status: true,
            content: true,
            updatedAt: true,
            area: { select: { id: true, name: true } },
            blockedAt: true,
            blockReason: true,
            blockReply: true,
            blockReplyAt: true,
            blockedBy: { select: { firstName: true, lastName: true, username: true } },
            blockReplyBy: { select: { firstName: true, lastName: true, username: true } },
        },
    })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

    const isAuthor = access.authors.some((a: { userId: string }) => a.userId === userId)
    const isAreaOwner = access.area.ownerId === userId
    const canBlock = hasPermission(user.roles, 'article:block')

    const canEdit = isAuthor || isAreaOwner || hasPermission(user.roles, 'article:editAny')

    const canSeeBlock = isAuthor || isAreaOwner || canBlock

    return {
        id: article.id,
        title: article.title,
        status: article.status,
        updatedAt: article.updatedAt,
        area: article.area,
        html: renderArticleHtml(article.content),
        canEdit,
        canBlock,
        canReply: isAuthor || isAreaOwner,
        blocked: !!article.blockedAt,
        block: article.blockedAt && canSeeBlock
            ? {
                at: article.blockedAt,
                by: article.blockedBy,
                reason: article.blockReason,
                reply: article.blockReply,
                replyAt: article.blockReplyAt,
                replyBy: article.blockReplyBy,
            }
            : null,
    }
})