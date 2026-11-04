import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {



    const form = await readMultipartFormData(event)
    const file = form?.find(f => f.name === 'file' && f.filename)

    if (!file) throw createError({ statusCode: 400, message: 'Файл не передан' })
    if (!ALLOWED.includes(file.type ?? '')) {
        throw createError({ statusCode: 415, message: 'Неподдерживаемый формат' })
    }
    if (file.data.length > MAX_SIZE) {
        throw createError({ statusCode: 413, message: 'Файл больше 10 МБ' })
    }
    console.log("$NUXT_UPLOAD_DIR: ", process.env.NUXT_UPLOAD_DIR)
    const uploadRoot = process.env.NUXT_UPLOAD_DIR
    if (!uploadRoot) throw createError({ statusCode: 500, message: 'NUXT_UPLOAD_DIR не задан' })

    const now = new Date()
    const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const dir = resolve(uploadRoot, folder)
    await mkdir(dir, { recursive: true })

    const isGif = file.type === 'image/gif'
    const name = `${randomUUID()}${isGif ? '.gif' : '.webp'}`

    if (isGif) {
        await writeFile(resolve(dir, name), file.data)
    } else {
        await sharp(file.data)
            .rotate()
            .resize({ width: 1600, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(resolve(dir, name))
    }

    return { url: `/uploads/${folder}/${name}` }
})