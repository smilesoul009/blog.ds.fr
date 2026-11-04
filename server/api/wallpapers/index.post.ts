import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { WallpaperDevice } from '@prisma/client'
import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 25 * 1024 * 1024

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('wallpaper:manage')(event)

    const uploadRoot = process.env.NUXT_UPLOAD_DIR
    if (!uploadRoot) throw createError({ statusCode: 500, message: 'NUXT_UPLOAD_DIR не задан' })

    const form = await readMultipartFormData(event)
    const file = form?.find(f => f.name === 'file' && f.filename)
    const deviceField = form?.find(f => f.name === 'device')

    if (!file) throw createError({ statusCode: 400, message: 'Файл не передан' })
    if (!ALLOWED.includes(file.type ?? '')) {
        throw createError({ statusCode: 415, message: 'Поддерживаются JPG, PNG и WebP' })
    }
    if (file.data.length > MAX_SIZE) {
        throw createError({ statusCode: 413, message: 'Файл больше 25 МБ' })
    }

    const device = (deviceField?.data.toString() as WallpaperDevice) || 'DESKTOP'

    const dir = resolve(uploadRoot, 'wallpapers')
    await mkdir(dir, { recursive: true })

    const id = randomUUID()
    const fullName = `${id}.webp`
    const thumbName = `${id}-thumb.webp`

    const maxWidth = device === 'MOBILE' ? 1440 : 2560

    const info = await sharp(file.data)
        .rotate()
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(resolve(dir, fullName))

    await sharp(file.data)
        .rotate()
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 70 })
        .toFile(resolve(dir, thumbName))

    return prisma.wallpaper.create({
        data: {
            fileName: file.filename!,
            url: `/uploads/wallpapers/${fullName}`,
            thumbUrl: `/uploads/wallpapers/${thumbName}`,
            device,
            width: info.width,
            height: info.height,
            sizeBytes: info.size,
            uploadedById: event.context.userId,
        },
    })
})