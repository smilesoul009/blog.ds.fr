import { createReadStream, existsSync, statSync } from 'node:fs'
import { resolve, normalize } from 'node:path'

export default defineEventHandler((event) => {
    const uploadRoot = process.env.NUXT_UPLOAD_DIR
    if (!uploadRoot) throw createError({ statusCode: 500, message: 'NUXT_UPLOAD_DIR не задан' })

    const path = getRouterParam(event, 'path')
    console.log('uploads request:', { path, uploadRoot, target: resolve(uploadRoot, path ?? '') })
    if (!path) throw createError({ statusCode: 400, message: 'Путь не указан' })


    const target = normalize(resolve(uploadRoot, path))
    if (!target.startsWith(normalize(resolve(uploadRoot)))) {
        throw createError({ statusCode: 403, message: 'Недопустимый путь' })
    }

    if (!existsSync(target) || !statSync(target).isFile()) {
        throw createError({ statusCode: 404, message: 'Файл не найден' })
    }

    setHeader(event, 'Cache-Control', 'public, max-age=2592000')
    return sendStream(event, createReadStream(target))
})