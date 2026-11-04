import { z } from 'zod'
import { authCheck, permissionCheck } from '#server/utils/checks'
import { setSetting } from '#server/utils/settings'
import { WALLPAPER_SETTINGS_KEYS } from '~~/shared/constants/wallpaper'

const bodySchema = z.object({
    enabled: z.boolean().optional(),
    intervalMs: z.number().min(5_000).max(3_600_000).optional(),
    overlayOpacity: z.number().min(0).max(0.8).optional(),
})

export default defineEventHandler(async (event) => {
    await authCheck(event)
    await permissionCheck('settings:manage')(event)

    const body = bodySchema.parse(await readBody(event))

    for (const [field, value] of Object.entries(body)) {
        if (value === undefined) continue
        await setSetting(WALLPAPER_SETTINGS_KEYS[field as keyof typeof WALLPAPER_SETTINGS_KEYS], value)
    }

    return { ok: true }
})