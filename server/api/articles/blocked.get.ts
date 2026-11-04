import { prisma } from '#server/db/client'
import { authCheck } from '#server/utils/checks'
import { hasPermission } from '~~/shared/constants/permissions'
import { findCoverUrl } from '#server/utils/articlePreview'

const personSelect = { select: { id: true, firstName: true, lastName: true, username: true } }

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const userId = event.context.userId
    const user = event.context.user
    const seeAll = hasPermission(user.roles, 'article:block')

    const rows = await prisma.article.findMany({
        where: {
            blockedAt: { not: null },
            ...(!seeAll && {
                OR: [
                    { authors: { some: { userId } } },
                    { area: { ownerId: userId } },
                ],
            }),
        },
        orderBy: { blockedAt: 'desc' },
        select: {
            id: true,
            title: true,
            status: true,
            content: true,
            area: { select: { id: true, name: true } },
            authors: { select: { user: personSelect } },
            blockedAt: true,
            blockedBy: personSelect,
            blockReason: true,
            blockReply: true,
            blockReplyAt: true,
            blockReplyBy: personSelect,
        },
    })

    const items = rows.map(({ content, ...rest }) => ({
        ...rest,
        coverUrl: findCoverUrl(content),
    }))

    return { items }
})