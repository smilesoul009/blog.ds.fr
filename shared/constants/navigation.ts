import type { Permission } from './permissions'

export interface NavItem {
    label: string
    to?: string
    permission?: Permission
    children?: NavItem[]
    countKey?: 'unread' | 'favorites' | 'blocked'
    showCount?: boolean
    icon?: string        // значок в боковом меню (SideMenu)
    match?: string[]     // дополнительные адреса, где пункт подсвечен (с «/» на конце — только вложенные)
    separator?: boolean  // черта между группами пунктов (SideMenu); остальные поля не нужны
}

export const STAFF_NAVIGATION: NavItem[] = [
    { label: 'План', to: '/plan', permission: 'plan:use', match: ['/goals'] },
    { label: 'Статьи', to: '/articles', permission: 'article:create' },
    { label: 'Заблокированные', to: '/blocked', permission: 'article:block', countKey: 'blocked', showCount: true },
    { label: 'Статьи клиентам', to: '/clients', permission: 'client:manage' },
    { label: 'Подборки для гостей', to: '/spaces', permission: 'space:create' },
]

export const SETTINGS_NAVIGATION: NavItem[] = [
    { label: 'Пользователи', to: '/users', permission: 'user:manage' },
    { label: 'Аккаунты клиентов', to: '/settings/clients', permission: 'user:manage' },
    { label: 'Направления', to: '/areas', permission: 'area:manage' },
    { label: 'Журнал', to: '/audit', permission: 'audit:view' },
    { label: 'Обои', to: '/wallpapers', permission: 'wallpaper:manage' },
    { label: 'Уведомления', to: '/settings/notifications', permission: 'plan:use' },
]

// Раздел «План»: на этих адресах слева меню раздела (на /plan — только меню, без окна)
export const PLAN_SECTION = ['/plan', '/goals']

// «Временные»: выбор года и вида периода (/plan/time/…) и все списки и сетка недели. «2 года» и «3 года» в меню нет,
// но их старые адреса открываются (ссылки из уведомлений)
export const PLAN_TIME_PATHS = [
    '/plan/time', '/plan/periodic', '/plan/year3/', '/plan/year2/', '/plan/year/', '/plan/month/', '/plan/week/', '/plan/day/',
    '/plan/weekly',
]

// Боковое меню раздела «План», первый ярус. Годы и виды периода — в PlanSectionMenu (зависят от сегодняшней даты)
export const PLAN_NAVIGATION: NavItem[] = [
    { label: 'Временные', to: '/plan/time', match: PLAN_TIME_PATHS, icon: 'i-lucide-calendar-range', permission: 'plan:use' },
    { label: 'Целевые', to: '/goals', icon: 'i-lucide-target', permission: 'plan:use' },
]

export const CLIENT_NAVIGATION: NavItem[] = [
    { label: 'Новые статьи', to: '/cabinet/unread', countKey: 'unread', showCount: true },
    { label: 'Все статьи', to: '/cabinet/articles' },
    { label: 'Избранное', to: '/cabinet/favorites', countKey: 'favorites' },
]