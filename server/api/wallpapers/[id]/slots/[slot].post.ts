import { WallpaperSlot } from '@prisma/client'
import { prisma } from '#server/db/client'
import { authCheck, permissionCheck } from '#server/utils/checks'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('wallpaper:manage')(event)

    const wallpaperId = getRouterParam(event, 'id')
    const slotParam = getRouterParam(event, 'slot')

    if (!wallpaperId || !slotParam) {
        throw createError({ statusCode: 400, message: 'Не указаны параметры' })
    }

    const slot = slotParam as WallpaperSlot
    if (!Object.values(WallpaperSlot).includes(slot)) {
        throw createError({ statusCode: 400, message: 'Неизвестная страница' })
    }

    const wallpaper = await prisma.wallpaper.findUnique({
        where: { id: wallpaperId },
        select: { id: true },
    })
    if (!wallpaper) throw createError({ statusCode: 404, message: 'Изображение не найдено' })

    const existing = await prisma.wallpaperAssignment.findUnique({
        where: { wallpaperId_slot: { wallpaperId, slot } },
    })

    if (existing) {
        await prisma.wallpaperAssignment.delete({
            where: { wallpaperId_slot: { wallpaperId, slot } },
        })
        return { assigned: false }
    }

    const last = await prisma.wallpaperAssignment.findFirst({
        where: { slot },
        orderBy: { position: 'desc' },
        select: { position: true },
    })

    await prisma.wallpaperAssignment.create({
        data: { wallpaperId, slot, position: (last?.position ?? -1) + 1 },
    })

    return { assigned: true }
})