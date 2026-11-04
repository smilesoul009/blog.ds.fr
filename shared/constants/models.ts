export const MODEL_LABELS: Record<string, string> = {
    user: 'Пользователи',
    area: 'Направления',
    space: 'Подборки',
    article: 'Статьи',
    articleAuthor: 'Авторы статей',
    articleBlockReview: 'Замечания по тексту статей',
    articleStatusLog: 'История статусов',
    articleVersion: 'Версии статей',
    spaceArticle: 'Статьи в подборке',
    spaceAccessLink: 'Ссылки доступа',
    userSpace: 'Участники подборок',
    userArea: 'Участники направлений',
}

export function modelLabel(name: string) {
    return MODEL_LABELS[name] ?? name
}