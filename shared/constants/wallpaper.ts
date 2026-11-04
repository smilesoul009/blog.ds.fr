import type { WallpaperDevice, WallpaperSlot } from '@prisma/client'

export const WALLPAPER_DEVICE_LABELS: Record<WallpaperDevice, string> = {
    DESKTOP: 'Компьютерная версия',
    MOBILE: 'Мобильная версия',
}

export const WALLPAPER_SLOT_LABELS: Record<WallpaperSlot, string> = {
    LOGIN: 'Страница входа',
    APP: 'Основной интерфейс',
    LOGOUT: 'Страница выхода',
    CLIENT: 'Подборки клиента',
}

export const WALLPAPER_SETTINGS_KEYS = {
    enabled: 'wallpaper.enabled',
    intervalMs: 'wallpaper.intervalMs',
    overlayOpacity: 'wallpaper.overlayOpacity',
} as const

export const WALLPAPER_DEFAULTS = {
    enabled: true,
    intervalMs: 60_000,
    overlayOpacity: 0.25,
}