/** Условие «статью может видеть клиент или гость»: готова и не заблокирована */
export const publicArticleWhere = {
    status: 'READY' as const,
    blockedAt: null,
}