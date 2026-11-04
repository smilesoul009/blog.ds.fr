import {useUserStore} from "~~/stores/user.ts";

export default defineNuxtRouteMiddleware(async (to) => {
    const publicPrefixes = ['/login', '/register', '/view']
    const isPublic = to.path === '/'
        || publicPrefixes.some(p => to.path === p || to.path.startsWith(`${p}/`))

    const store = useUserStore()
    const { isAuthenticated, user } = storeToRefs(store)

    await store.fetchUser()

    const isClient = computed(() => user.value?.roles.includes('CLIENT') ?? false)

    if (isAuthenticated.value && (to.path === '/' || to.path === '/login' || to.path === '/register')) {
        return navigateTo(isClient.value ? '/cabinet' : '/dashboard')
    }

    if (!isAuthenticated.value && !isPublic) {
        return navigateTo('/login')
    }

    if (isAuthenticated.value && isClient.value && !to.path.startsWith('/cabinet')) {
        return navigateTo('/cabinet')
    }

    if (isAuthenticated.value && !isClient.value && to.path.startsWith('/cabinet')) {
        return navigateTo('/dashboard')
    }
})