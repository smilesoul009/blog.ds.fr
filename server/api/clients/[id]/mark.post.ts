import { z } from 'zod'
import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

const bodySchema = z.object({
    comment: z.string().optional(),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('client:manage')(event)

    const clientId = getRouterParam(event, 'id')
    if (!clientId) throw createError({ statusCode: 400, message: 'ID не указан' })

    const authorId = event.context.userId
    const { comment } = bodySchema.parse(await readBody(event))

    const existing = await prisma.clientAuthor.findUnique({
        where: { clientId_authorId: { clientId, authorId } },
    })

    if (existing && comment === undefined) {
        await prisma.clientAuthor.delete({
            where: { clientId_authorId: { clientId, authorId } },
        })
        return { marked: false }
    }

    await prisma.clientAuthor.upsert({
        where: { clientId_authorId: { clientId, authorId } },
        create: { clientId, authorId, comment: comment ?? null },
        update: { comment: comment ?? null },
    })

    return { marked: true }
})