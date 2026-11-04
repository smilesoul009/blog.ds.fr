import {klona} from 'klona'
import type {ZodType} from "zod";

interface UseEditableFormOptions<T extends Record<string, any>> {
    initial: T
    isNew?: boolean
    load?: () => Promise<T>
    create?: (data: T) => Promise<any>
    update?: (data: T) => Promise<any>
    onCreated?: (result: any) => void | Promise<void>
    compareDelay?: number
    schema?: ZodType
}

export function useEditableForm<T extends Record<string, any>>(
    options: UseEditableFormOptions<T>,
) {
    const toast = useToast()

    const isNew = ref(!options.load)
    const loading = ref(false)
    const saving = ref(false)
    const errors = ref<Record<string, string>>({})

    const form = reactive<T>(klona(options.initial)) as T
    const snapshot = ref(JSON.stringify(options.initial))
    const isDirty = ref(false)

    const currentJson = computed(() => JSON.stringify(form))

    const pendingPristine = ref(false)

    function markPristine() {
        snapshot.value = JSON.stringify(form)
        isDirty.value = false
        pendingPristine.value = false
    }

    watchDebounced(
        currentJson,
        (value) => {
            if (pendingPristine.value) {
                markPristine()
                return
            }
            isDirty.value = value !== snapshot.value
        },
        {debounce: options.compareDelay ?? 250},
    )

    function applyData(data: T) {
        Object.assign(form, klona(data))
        snapshot.value = JSON.stringify(form)
        isDirty.value = false
        pendingPristine.value = true
    }

    function reset() {
        Object.assign(form, klona(JSON.parse(snapshot.value)))
        isDirty.value = false
        pendingPristine.value = true
    }

    async function load() {
        if (!options.load) return
        loading.value = true
        try {
            applyData(await options.load())
            isNew.value = false
        } finally {
            loading.value = false
        }
    }



    async function save() {

        errors.value = {}

        if (options.schema) {
            const result = options.schema.safeParse(toRaw(form))
            if (!result.success) {
                for (const issue of result.error.issues) {
                    const key = issue.path.join('.')
                    if (!errors.value[key]) errors.value[key] = issue.message
                }
                toast.add({title: 'Проверьте заполнение полей', color: 'error'})
                return null
            }
        }

        saving.value = true
        try {
            const payload = klona(toRaw(form)) as T

            if (isNew.value) {
                const created = await options.create?.(payload)
                toast.add({title: 'Создано', color: 'success'})
                isNew.value = false
                snapshot.value = JSON.stringify(form)
                isDirty.value = false
                await options.onCreated?.(created)
                return created
            }

            await options.update?.(payload)
            toast.add({title: 'Сохранено', color: 'success'})

            if (options.load) {
                applyData(await options.load())
            } else {
                snapshot.value = JSON.stringify(form)
                isDirty.value = false
            }

            return true
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

    function confirmLeave() {
        if (!isDirty.value) return true
        return window.confirm('Есть несохранённые изменения. Уйти со страницы?')
    }

    onBeforeRouteLeave(() => confirmLeave())

    if (import.meta.client) {
        useEventListener(window, 'beforeunload', (e) => {
            if (!isDirty.value) return
            e.preventDefault()
        })
    }

    return {form, isNew, isDirty, loading, saving, load, save, reset, applyData, markPristine, errors}
}