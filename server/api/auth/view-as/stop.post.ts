export default defineEventHandler((event) => {
    deleteCookie(event, 'view_as', { path: '/' })
    return { ok: true }
})