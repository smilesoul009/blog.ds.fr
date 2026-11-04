declare module '#app' {
    interface NuxtApp {
        $api: typeof $fetch
    }
}

export {}