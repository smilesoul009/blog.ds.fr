// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: [
        '@nuxt/ui',
        '@pinia/nuxt',
        '@vueuse/nuxt'
    ],

    devtools: {
        enabled: true
    },

    css: ['~/assets/css/main.css','~/assets/css/article-content.css'],

    routeRules: {
        '/': {prerender: true}
    },
    compatibilityDate: '2026-06-30',

    vite: {
        optimizeDeps: {
            include: [
                '@nuxt/ui > prosemirror-state',
                '@nuxt/ui > prosemirror-transform',
                '@nuxt/ui > prosemirror-model',
                '@nuxt/ui > prosemirror-view',
                '@nuxt/ui > prosemirror-gapcursor'
            ]
        }
    },

    icon: {
        fallbackToApi: false,
        clientBundle: {scan: true}
    },

    fonts: {
        families: [
            {name: 'Inter', src: '/fonts/Inter.woff2', weight: 400, global: true},
            {name: 'Roboto', src: '/fonts/Roboto.woff2', weight: 400, global: true},
            {name: 'Merriweather', src: '/fonts/Merriweather.woff2', weight: 400, global: true}
        ]
    },



    typescript: {
        tsConfig: {
            compilerOptions: {
                types: ['node']
            }
        }
    },

    nitro: {
        compressPublicAssets: true,
        experimental: {
            tasks: true,
        },
        scheduledTasks: {
            // каждый день в 03:00 по времени сервера
            '0 3 * * *': ['accounts:purge', 'notifications:purge', 'trash:purge'],
            // каждую минуту: напоминания по плану (время — по часовому поясу пользователя)
            '* * * * *': ['plan:remind'],
        },
    },

    runtimeConfig: {
        jwtSecret: '',
        uploadDir: '',
        public: {
            siteUrl: '',
        },
    },
})
