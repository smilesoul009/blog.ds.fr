import { authCheck } from '#server/utils/checks'
import { getSettings } from '#server/utils/settings'
import { WALLPAPER_DEFAULTS, WALLPAPER_SETTINGS_KEYS } from '~~/shared/constants/wallpaper'

export default defineEventHandler(async (event) => {
    await authCheck(event)
    return getSettings(WALLPAPER_DEFAULTS, WALLPAPER_SETTINGS_KEYS)
})