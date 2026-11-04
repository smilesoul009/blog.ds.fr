import bcrypt from 'bcryptjs'
import { prisma } from '#server/db/client'
import { signJWT } from '#server/utils/jwt'
import { clientRegisterSchema } from '~~/shared/schemas/client'
import { writeAudit } from '#server/utils/audit'

export default defineEventHandler(async (event) => {
    const body = clientRegisterSchema.parse(await readBody(event))

    const existing = await prisma.user.findFirst({
        where: { OR: [{ username: body.username }, { email: body.email }] },
        select: { id: true, username: true },
    })

    if (existing) {
        throw createError({
            statusCode: 409,
            message: existing.username === body.username
                ? 'Логин уже занят'
                : 'Этот адрес уже зарегистрирован',
        })
    }

    const user = await prisma.user.create({
        data: {
            username: body.username,
            email: body.email,
            passwordHash: await bcrypt.hash(body.password, 10),
            firstName: body.firstName ?? '',
            lastName: body.lastName ?? '',
            roles: ['CLIENT'],
        },
    })

    if (body.token) {
        const link = await prisma.spaceAccessLink.findUnique({
            where: { token: body.token },
            select: { spaceId: true, revokedAt: true, expiresAt: true },
        })

        const valid = link
            && !link.revokedAt
            && (!link.expiresAt || link.expiresAt > new Date())

        if (valid) {
            const items = await prisma.spaceArticle.findMany({
                where: { spaceId: link.spaceId, article: { status: 'READY' } },
                select: { articleId: true },
            })

            if (items.length) {
                await prisma.clientArticle.createMany({
                    data: items.map(i => ({
                        clientId: user.id,
                        articleId: i.articleId,
                        assignedAt: new Date(),
                    })),
                    skipDuplicates: true,
                })
            }
        }
    }

    setCookie(event, 'auth_token', signJWT({ userId: user.id }), {
        httpOnly: true,
        secure: !import.meta.dev,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    })

    writeAudit({
        action: 'CREATE',
        entityType: 'User',
        entityId: user.id,
        entityName: user.username,
        userId: user.id,
    })

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        isActive: user.isActive,
        createdAt: user.createdAt,
    }
})