import type { JSONContent } from '@tiptap/vue-3'
import type { ArticleStatus } from '@prisma/client'

export interface ArticleFormState {
    title: string
    areaId: string
    content: JSONContent
}

const emptyDoc = (): JSONContent => ({ type: 'doc', content: [{ type: 'paragraph' }] })

export function useArticleForm(id?: string) {
    const api = useApi()
    const toast = useToast()
    const saving = ref(false)

    const form = reactive<ArticleFormState>({
        title: '',
        areaId: '',
        content: emptyDoc(),
    })

    const status = ref<ArticleStatus>('DRAFT')
    const loaded = ref(!id)

    async function load() {
        if (!id) return
        const data = await api<any>(`/api/articles/${id}`)
        form.title = data.title
        form.areaId = data.areaId
        form.content = data.content
        status.value = data.status
        loaded.value = true
    }

    async function save(plainText: string) {
        saving.value = true
        try {
            const body = { ...form, plainText }

            if (id) {
                await api(`/api/articles/${id}`, { method: 'PATCH', body })
                toast.add({ title: 'Сохранено', color: 'success' })
                return id
            }

            const created = await api<{ id: string }>('/api/articles', { method: 'POST', body })
            toast.add({ title: 'Статья создана', color: 'success' })
            return created.id
        } catch (e: any) {
            toast.add({
                title: 'Не удалось сохранить',
                description: e?.data?.message,
                color: 'error',
            })
            return null
        } finally {
            saving.value = false
        }
    }

    return { form, status, saving, loaded, load, save }
}