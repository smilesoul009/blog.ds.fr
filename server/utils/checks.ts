import {getCookie, createError, type H3Event} from 'h3'
import {prisma} from '#server/db/client'
import {hasPermission, type Permission} from '~~/shared/constants/permissions'
import {verifyJWT, verifyViewAs} from './jwt'

export type Check = (event: H3Event) => Promise<void> | void

export const authCheck: Check = async (event) => {
    const token = getCookie(event, 'auth_token')
    if (!token) throw createError({statusCode: 401, message: 'Не авторизован'})

    const payload = verifyJWT(token)
    if (!payload) throw createError({statusCode: 401, message: 'Неверный токен'})

    const user = await prisma.user.findUnique({
        where: {id: payload.userId},
        select: {id: true, roles: true, isActive: true}
    })
    if (!user || !user.isActive) {
        throw createError({statusCode: 401, message: 'Доступ отозван'})
    }

    event.context.userId = user.id
    event.context.user = user

    // Режим «просмотр как пользователь»: подменяем пользователя на того, под кем смотрим
    const viewAsToken = getCookie(event, 'view_as')
    if (viewAsToken) {
        const viewAs = verifyViewAs(viewAsToken)
        if (viewAs && viewAs.adminId === user.id && hasPermission(user.roles, 'user:viewAs')) {
            const target = await prisma.user.findUnique({
                where: {id: viewAs.targetId},
                select: {id: true, roles: true, isActive: true}
            })
            if (target && !target.roles.includes('ADMIN')) {
                event.context.realUserId = user.id
                event.context.userId = target.id
                event.context.user = target
                event.context.readOnly = true
                event.context.viewAsExpiresAt = (viewAs.exp ?? 0) * 1000
            }
        }
    }

    // В режиме просмотра разрешено только читать
    if (event.context.readOnly && !['GET', 'HEAD'].includes(event.method)) {
        throw createError({statusCode: 403, message: 'Недоступно в режиме просмотра'})
    }
}

async function loadUser(event: H3Event) {
    if (event.context.user) return event.context.user

    const userId = event.context.userId
    if (!userId) throw createError({statusCode: 401, message: 'Не авторизован'})

    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {id: true, roles: true}
    })
    if (!user) throw createError({statusCode: 404, message: 'Пользователь не найден'})

    event.context.user = user
    return user
}

export function permissionCheck(permission: Permission): Check {
    return async (event) => {
        const user = await loadUser(event)
        if (!hasPermission(user.roles, permission)) {
            throw createError({statusCode: 403, message: 'Недостаточно прав'})
        }
    }
}

export function canEditArticle(paramName = 'id'): Check {
    return async (event) => {
        const userId = event.context.userId
        if (!userId) throw createError({ statusCode: 401, message: 'Не авторизован' })

        const id = getRouterParam(event, paramName)
        if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

        const article = await prisma.article.findUnique({
            where: { id },
            include: {
                authors: { select: { userId: true } },
                area: { select: { ownerId: true } },
            },
        })
        if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

        const user = event.context.user ?? await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, roles: true },
        })
        if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

        event.context.user = user
        event.context.article = article

        const isAuthor = article.authors.some(a => a.userId === userId)
        const isAreaOwner = article.area.ownerId === userId
        const canEditAny = hasPermission(user.roles, 'article:editAny')

        if (!isAuthor && !isAreaOwner && !canEditAny) {
            throw createError({ statusCode: 403, message: 'Недостаточно прав для редактирования' })
        }

        if (article.status === 'ARCHIVED') {
            throw createError({ statusCode: 409, message: 'Статья в архиве, восстановите её для редактирования' })
        }
    }
}

export function canReviewArticle(paramName = 'id'): Check {
    return async (event) => {
        const userId = event.context.userId
        if (!userId) throw createError({statusCode: 401, message: 'Не авторизован'})

        const id = getRouterParam(event, paramName)
        if (!id) throw createError({statusCode: 400, message: 'ID не указан'})

        const user = event.context.user ?? await prisma.user.findUnique({
            where: {id: userId},
            select: {id: true, roles: true},
        })
        if (!user) throw createError({statusCode: 404, message: 'Пользователь не найден'})
        event.context.user = user

        if (!hasPermission(user.roles, 'article:review')) {
            throw createError({statusCode: 403, message: 'Нет прав на согласование'})
        }

        const article = await prisma.article.findUnique({
            where: {id},
            select: {id: true, status: true, content: true},
        })
        if (!article) throw createError({statusCode: 404, message: 'Статья не найдена'})

        if (article.status !== 'REVIEW') {
            throw createError({
                statusCode: 409,
                message: 'Согласовывать можно только статью на согласовании',
            })
        }

        event.context.article = article
    }
}

export function spaceAccessCheck(paramName = 'id'): Check {
    return async (event) => {
        const userId = event.context.userId
        if (!userId) throw createError({statusCode: 401, message: 'Не авторизован'})

        const spaceId = getRouterParam(event, paramName)
        if (!spaceId) throw createError({statusCode: 400, message: 'ID подборки не указан'})

        const user = event.context.user ?? await prisma.user.findUnique({
            where: {id: userId},
            select: {id: true, roles: true},
        })
        if (!user) throw createError({statusCode: 404, message: 'Пользователь не найден'})
        event.context.user = user

        const space = await prisma.space.findUnique({
            where: {id: spaceId},
            include: {users: {select: {userId: true}}},
        })
        if (!space) throw createError({statusCode: 404, message: 'Подборка не найдена'})

        const isOwner = space.ownerId === userId
        const isMember = space.users.some(u => u.userId === userId)
        const canManageAny = hasPermission(user.roles, 'space:manageAny')

        if (!isOwner && !isMember && !canManageAny) {
            throw createError({statusCode: 403, message: 'Нет доступа к подборке'})
        }

        event.context.space = space
    }
}

export const accessLinkCheck: Check = async (event) => {
    const token = getRouterParam(event, 'token')
    if (!token) throw createError({statusCode: 400, message: 'Токен не указан'})

    const link = await prisma.spaceAccessLink.findUnique({
        where: {token},
        include: {space: {select: {id: true, name: true, description: true}}},
    })
    if (!link) throw createError({statusCode: 404, message: 'Ссылка не найдена'})
    if (link.revokedAt) throw createError({statusCode: 403, message: 'Ссылка отозвана'})
    if (link.expiresAt && link.expiresAt < new Date()) {
        throw createError({statusCode: 403, message: 'Срок действия ссылки истёк'})
    }

    event.context.accessLink = link
    event.context.space = link.space
}

export function areaMemberCheck(fieldName = 'areaId'): Check {
    return async (event) => {
        const userId = event.context.userId
        if (!userId) throw createError({ statusCode: 401, message: 'Не авторизован' })

        const body = await readBody(event)
        const areaId = body[fieldName]
        if (!areaId) throw createError({ statusCode: 400, message: 'Направление не указано' })

        const user = event.context.user ?? await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, roles: true },
        })
        if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })
        event.context.user = user

        if (hasPermission(user.roles, 'article:editAny')) return

        const area = await prisma.area.findUnique({
            where: { id: areaId },
            select: { ownerId: true, users: { where: { userId }, select: { userId: true } } },
        })
        if (!area) throw createError({ statusCode: 404, message: 'Направление не найдено' })

        if (area.ownerId !== userId && !area.users.length) {
            throw createError({ statusCode: 403, message: 'Вы не участвуете в этом направлении' })
        }
    }
}

export function canViewArticle(paramName = 'id'): Check {
    return async (event) => {
        const userId = event.context.userId
        if (!userId) throw createError({ statusCode: 401, message: 'Не авторизован' })

        const id = getRouterParam(event, paramName)
        if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

        const article = await prisma.article.findUnique({
            where: { id },
            include: {
                authors: { select: { userId: true } },
                area: {
                    select: {
                        ownerId: true,
                        users: { where: { userId }, select: { userId: true } },
                    },
                },
            },
        })
        if (!article) throw createError({ statusCode: 404, message: 'Статья не найдена' })

        const user = event.context.user ?? await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, roles: true },
        })
        if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })

        event.context.user = user
        event.context.article = article

        const canEditAny = hasPermission(user.roles, 'article:editAny')
        const isMember = article.area.ownerId === userId || article.area.users.length > 0

        if (!canEditAny && !isMember) {
            throw createError({ statusCode: 403, message: 'Нет доступа к этому направлению' })
        }
    }
}

export const clientCheck: Check = async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, message: 'Не авторизован' })

    if (!user.roles.includes('CLIENT')) {
        throw createError({ statusCode: 403, message: 'Раздел доступен только клиентам' })
    }
}