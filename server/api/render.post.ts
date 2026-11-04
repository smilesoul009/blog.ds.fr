import { authCheck } from '#server/utils/checks'
import { renderArticleHtml } from '#server/utils/renderArticle'

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const { content } = await readBody(event)
    if (!content) throw createError({ statusCode: 400, message: 'Содержимое не передано' })

    return { html: renderArticleHtml(content) }
})