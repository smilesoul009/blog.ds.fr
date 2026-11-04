import type { H3Event } from 'h3'
import { WallpaperDevice } from '@prisma/client'

const MOBILE_RE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i

export function detectDevice(event: H3Event): WallpaperDevice {
    const ua = getRequestHeader(event, 'user-agent') ?? ''
    return MOBILE_RE.test(ua) ? 'MOBILE' : 'DESKTOP'
}