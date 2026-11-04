import { prisma } from '#server/db/client'
import { Prisma } from '@prisma/client'

const DAY = 24 * 60 * 60 * 1000

export async function purgeExpiredAccounts() {
    const threshold = new Date(Date.now() - 30 * DAY)

    const expired = await prisma.user.findMany({
        where: {
            deletionRequestedAt: { lte: threshold },
            deletedAt: null,
        },
        select: { id: true },
    })

    for (const { id } of expired) {
        await prisma.$transaction([
            prisma.clientArticle.deleteMany({ where: { clientId: id } }),
            prisma.clientAuthor.deleteMany({ where: { clientId: id } }),
            prisma.auditLog.updateMany({
                where: { entityType: 'User', entityId: id },
                data: { entityName: 'Удалённый аккаунт', snapshot: Prisma.DbNull, changes: Prisma.DbNull },
            }),
            prisma.user.update({
                where: { id },
                data: {
                    username: `deleted-${id}`,
                    email: `deleted-${id}@local`,
                    firstName: '',
                    lastName: '',
                    passwordHash: '',
                    isActive: false,
                    deletedAt: new Date(),
                },
            }),
        ])
    }

    return { purged: expired.length }
}