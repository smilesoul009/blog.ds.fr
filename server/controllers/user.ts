import {z} from 'zod'
import bcrypt from 'bcryptjs'
import {Role} from '@prisma/client'
import {prisma} from '#server/db/client'
import {defineCrud} from '#server/utils/defineCrud'
import {authCheck, permissionCheck} from '#server/utils/checks'
import {userCreateSchema, userUpdateSchema} from "#shared/schemas/user.ts";

const safeSelect = {
    id: true,
    username: true,
    email: true,
    firstName: true,
    lastName: true,
    isActive: true,
    roles: true,
    createdAt: true,
    updatedAt: true
} as const

function hashPassword(data: any) {
    const {password, ...rest} = data
    return password
        ? {...rest, passwordHash: bcrypt.hashSync(password, 10)}
        : rest
}

export const userController = defineCrud({
    model: prisma.user,
    label: 'Участник',
    notFoundMessage: 'Участник не найден',
    singular: 'user',
    createSchema: userCreateSchema,
    updateSchema: userUpdateSchema,
    select: safeSelect,
    searchFields: ['username', 'email', 'firstName', 'lastName'],
    buildWhere: (query) => {
        const where: any = {
            NOT: {roles: {has: 'CLIENT'}},
            deletedAt: null,
        }

        if (query.isActive === undefined) {
            where.isActive = true
        } else {
            where.isActive = query.isActive !== 'false'
        }

        return where
    },
    defaultSort: [
        {field: 'lastName'},
        {field: 'firstName'}
    ],
    relations: ['articleAuthor', 'userSpace', 'userArea', {model: 'space', fk: 'ownerId'}],
    transformCreate: hashPassword,
    transformUpdate: (data, event) => {
        const isSelf = getRouterParam(event, 'id') === event.context.userId
        if (isSelf && (data.isActive === false || (data.roles && !data.roles.includes('ADMIN')))) {
            throw createError({
                statusCode: 409,
                message: 'Нельзя отключить себя или снять с себя роль администратора'
            })
        }
        return hashPassword(data)
    },
    checks: {
        list: [authCheck],
        detail: [authCheck],
        create: [authCheck, permissionCheck('user:manage')],
        update: [authCheck, permissionCheck('user:manage')],
        delete: [authCheck, permissionCheck('user:manage')]
    },
    audit: {entityType: 'User', nameField: 'username'},
})
