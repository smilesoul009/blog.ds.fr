export function useReaderView(key = 'reader-view') {
    return useCookie<'cards' | 'list'>(key, {
        default: () => 'cards',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
    })
}