import { unlink } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('wallpaper:manage')(event)

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })

    const wallpaper = await prisma.wallpaper.findUnique({ where: { id } })
    if (!wallpaper) throw createError({ statusCode: 404, message: 'Изображение не найдено' })

    const uploadRoot = process.env.NUXT_UPLOAD_DIR
    if (uploadRoot) {
        const dir = resolve(uploadRoot, 'wallpapers')
        for (const url of [wallpaper.url, wallpaper.thumbUrl]) {
            await unlink(resolve(dir, basename(url))).catch(() => {})
        }
    }

    await prisma.wallpaper.delete({ where: { id } })
    return { ok: true }
})