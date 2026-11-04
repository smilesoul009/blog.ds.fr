import { z } from 'zod'
import { prisma } from '#server/db/client'
import { authCheck, spaceAccessCheck } from '#server/utils/checks'

const bodySchema = z.object({
    articleId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await spaceAccessCheck()(event)

    const spaceId = getRouterParam(event, 'id')!
    const { articleId } = bodySchema.parse(await readBody(event))

    const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true, status: true },
    })
    if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

    if (article.status === 'ARCHIVED') {
        throw createError({ statusCode: 409, message: 'Нельзя добавить статью из архива' })
    }

    const last = await prisma.spaceArticle.findFirst({
        where: { spaceId },
        orderBy: { position: 'desc' },
        select: { position: true },
    })

    return prisma.spaceArticle.upsert({
        where: { spaceId_articleId: { spaceId, articleId } },
        create: { spaceId, articleId, position: (last?.position ?? -1) + 1 },
        update: {},
        include: { article: { select: { id: true, title: true, slug: true, status: true } } },
    })
})