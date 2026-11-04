import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '#server/db/client'
import { authCheck, spaceAccessCheck } from '#server/utils/checks'

const bodySchema = z.object({
    label: z.string().optional(),
    expiresAt: z.string().datetime().optional().nullable(),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await spaceAccessCheck()(event)

    const { label, expiresAt } = bodySchema.parse(await readBody(event))

    return prisma.spaceAccessLink.create({
        data: {
            spaceId: getRouterParam(event, 'id')!,
            token: randomBytes(24).toString('base64url'),
            label: label?.trim() || null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
    })
})