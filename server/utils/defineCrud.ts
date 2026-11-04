import {createError, type H3Event} from 'h3'
import {ZodError, type ZodType} from 'zod'
import {prisma} from '#server/db/client'
import type {Check} from './checks'
import {modelLabel} from "#shared/constants/models.ts";

export type Handler = (event: H3Event) => Promise<any> | any
export type SortOrder = 'asc' | 'desc'
export type SortItem = { field: string, direction?: SortOrder }

export interface CrudConfig {
    model: any
    singular: string
    createSchema: ZodType
    updateSchema: ZodType
    include?: any
    select?: any
    checks?: Partial<Record<'list' | 'create' | 'detail' | 'update' | 'delete', Check[]>>
    allowedFilters?: string[]
    searchFields?: string[]
    defaultSort?: SortItem | SortItem[]
    maxLimit?: number
    buildWhere?: (query: any, event: H3Event) => any
    preTransform?: (body: any, event: H3Event) => any
    preTransformCreate?: (body: any, event: H3Event) => any
    preTransformUpdate?: (body: any, event: H3Event) => any
    transformCreate?: (data: any, event: H3Event) => any
    transformUpdate?: (data: any, event: H3Event) => any
    transformOutput?: (data: any, event: H3Event) => any
    relations?: (string | { model: string, fk?: string })[]
    custom?: Record<string, Handler>
    label?: string
    notFoundMessage?: string
    audit?: {
        entityType: string
        nameField?: string
        actions?: ('CREATE' | 'UPDATE' | 'DELETE')[]
    }
}

function parse(schema: ZodType, data: unknown) {
    try {
        return schema.parse(data)
    } catch (error) {
        if (error instanceof ZodError) {
            throw createError({
                statusCode: 400,
                message: 'Ошибка валидации',
                data: error.issues
            })
        }
        throw error
    }
}

export function defineCrud(config: CrudConfig) {
    const {
        model, singular, createSchema, updateSchema,
        include = {}, select, checks = {}, allowedFilters = [], searchFields = [],
        defaultSort, maxLimit = 100, buildWhere,
        preTransform, preTransformCreate, preTransformUpdate, transformCreate, transformUpdate,
        transformOutput, relations = [], custom = {}, label, notFoundMessage = null, audit
    } = config

    const title = label ?? singular

    const run = async (event: H3Event, list: Check[] = []) => {
        for (const check of list) await check(event)
    }

    const out = (data: any, event: H3Event) =>
        transformOutput ? transformOutput(data, event) : data

    const buildOrderBy = (query: any) => {
        if (query.sortBy) {
            return [{[query.sortBy]: query.order === 'desc' ? 'desc' : 'asc'}]
        }
        if (defaultSort) {
            const items = Array.isArray(defaultSort) ? defaultSort : [defaultSort]
            return items.map(s => ({[s.field]: s.direction ?? 'asc'}))
        }
        return [{createdAt: 'desc'}]
    }

    const shape = select ? {select} : {include: include ?? {}}

    const list = defineEventHandler(async (event) => {
        await run(event, checks.list)

        const query = getQuery(event) as Record<string, any>
        const page = Math.max(1, parseInt(query.page) || 1)
        const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || 10))

        const where: any = buildWhere ? buildWhere(query, event) : {}

        for (const key of allowedFilters) {
            if (query[key] !== undefined && where[key] === undefined) {
                where[key] = query[key]
            }
        }

        if (query.search && searchFields.length) {
            where.OR = searchFields.map(field => ({
                [field]: {contains: String(query.search), mode: 'insensitive'}
            }))
        }

        const [items, total] = await Promise.all([
            model.findMany({skip: (page - 1) * limit, take: limit, orderBy: buildOrderBy(query), where, ...shape}),
            model.count({where})
        ])

        return out({items, total, page, limit, totalPages: Math.ceil(total / limit)}, event)
    })

    const create = defineEventHandler(async (event) => {
        await run(event, checks.create)

        const body = await readBody(event)
        const pre = preTransformCreate ?? preTransform
        let data = parse(createSchema, pre ? pre(body, event) : body)
        if (transformCreate) data = transformCreate(data, event)
        const item = await model.create({data, ...shape})

        if (audit && (audit.actions ?? ['CREATE', 'UPDATE', 'DELETE']).includes('CREATE')) {
            writeAudit({
                action: 'CREATE',
                entityType: audit.entityType,
                entityId: item.id,
                entityName: audit.nameField ? item[audit.nameField] : null,
                userId: event.context.userId,
            })
        }
        return out(item, event)
    })

    const detail = defineEventHandler(async (event) => {
        await run(event, checks.detail)

        const id = getRouterParam(event, 'id')
        if (!id) throw createError({statusCode: 400, message: `Код ${title} не указан`})

        const item = await model.findUnique({where: {id}, ...shape})
        if (!item) throw createError({statusCode: 404, message: notFoundMessage ?? 'Запись не найдена'})

        return out(item, event)
    })

    const update = defineEventHandler(async (event) => {
        await run(event, checks.update)

        const id = getRouterParam(event, 'id')
        if (!id) throw createError({statusCode: 400, message: 'ID не указан'})

        const body = await readBody(event)
        const pre = preTransformUpdate ?? preTransform
        let data = parse(updateSchema, pre ? pre(body, event) : body)
        if (transformUpdate) data = transformUpdate(data, event)

        const before = audit ? await model.findUnique({ where: { id } }) : null

        const item = await model.update({where: {id}, data, ...shape})

        if (audit && (audit.actions ?? ['CREATE', 'UPDATE', 'DELETE']).includes('UPDATE')) {
            const changes = computeChanges(before, item)
            if (changes) {
                writeAudit({
                    action: 'UPDATE',
                    entityType: audit.entityType,
                    entityId: id,
                    entityName: audit.nameField ? item[audit.nameField] : null,
                    changes,
                    userId: event.context.userId,
                })
            }
        }

        return out(item, event)
    })

    const remove = defineEventHandler(async (event) => {
        await run(event, checks.delete)

        const id = getRouterParam(event, 'id')
        if (!id) throw createError({statusCode: 400, message: 'ID не указан'})

        if (relations.length) {
            const counts = await Promise.all(relations.map(async (rel) => {
                const modelName = typeof rel === 'string' ? rel : rel.model
                const fk = typeof rel === 'string' ? `${singular}Id` : (rel.fk ?? `${singular}Id`)
                const delegate = (prisma as any)[modelName]
                if (!delegate) throw new Error(`Модель "${modelName}" не найдена в PrismaClient`)
                return {model: modelName, count: await delegate.count({where: {[fk]: id}})}
            }))

            const blocking = counts.filter(c => c.count > 0)
            if (blocking.length) {
                throw createError({
                    statusCode: 409,
                    message: `Невозможно удалить: есть связанные записи (${blocking.map(c => `${modelLabel(c.model)}: ${c.count}`).join(', ')})`,
                    data: blocking
                })
            }
        }

        const snapshot = audit ? await model.findUnique({ where: { id } }) : null

        await model.delete({where: {id}})

        if (audit && (audit.actions ?? ['CREATE', 'UPDATE', 'DELETE']).includes('DELETE')) {
            const { passwordHash, ...safeSnapshot } = snapshot ?? {}
            writeAudit({
                action: 'DELETE',
                entityType: audit.entityType,
                entityId: id,
                entityName: audit.nameField ? snapshot?.[audit.nameField] : null,
                snapshot: safeSnapshot,
                userId: event.context.userId,
            })
        }

        return {ok: true}
    })

    return {list, create, detail, update, delete: remove, ...custom}
}
