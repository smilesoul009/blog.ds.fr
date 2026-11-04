import { authCheck } from '#server/utils/checks'
import { renderArticleHtml } from '#server/utils/renderArticle'

export default defineEventHandler(async (event) => {
    await authCheck(event)

    const { node } = await readBody(event)
    if (!node) throw createError({ statusCode: 400, message: 'Блок не передан' })

    return { html: renderArticleHtml({ type: 'doc', content: [node] }) }
})