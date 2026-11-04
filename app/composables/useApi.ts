export function useApi() {
    return useNuxtApp().$api as typeof $fetch
}