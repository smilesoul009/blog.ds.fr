export default defineNuxtPlugin(() => {
    const api = $fetch.create({
        onRequest({ options }) {
            if (import.meta.server) {
                options.headers = { ...options.headers, ...useRequestHeaders(['cookie']) }
            }
        },
    })
    return { provide: { api } }
})