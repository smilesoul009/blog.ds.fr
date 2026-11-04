export default defineEventHandler((event) => {
  deleteCookie(event, 'auth_token', { path: '/' })
  deleteCookie(event, 'view_as', { path: '/' })
  return { ok: true }
})
