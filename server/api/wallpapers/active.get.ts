import { WallpaperSlot, WallpaperDevice } from '@prisma/client'
import { prisma } from '#server/db/client'
import { getSettings } from '#server/utils/settings'
import { WALLPAPER_DEFAULTS, WALLPAPER_SETTINGS_KEYS } from '~~/shared/constants/wallpaper'
import {detectDevice} from "#server/utils/device.ts";

export default defineEventHandler(async (event) => {
    const query = getQuery(event) as { slot?: string; device?: string }

    const slot = (query.slot as WallpaperSlot) || 'APP'
    const device = (query.device as WallpaperDevice) || detectDevice(event)

    const settings = await getSettings(WALLPAPER_DEFAULTS, WALLPAPER_SETTINGS_KEYS)

    if (!settings.enabled) {
        return { settings, items: [] }
    }

    const assignments = await prisma.wallpaperAssignment.findMany({
        where: { slot, wallpaper: { device } },
        orderBy: { position: 'asc' },
        select: { wallpaper: { select: { id: true, url: true } } },
    })

    return {
        settings,
        items: assignments.map(a => a.wallpaper),
    }
})