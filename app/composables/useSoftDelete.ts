import {TRASH_LABEL, type TrashKind} from '~~/shared/constants/trash'

// «Удалённые»: удалить = положить в «Удалённые» (признак deletedAt), «Отменить» в сообщении (5 с) — вернуть.
// Счётчик на значке корзины (TrashButton) обновляется через общий тик trash:<kind>
export function useTrashTick(kind: TrashKind) {
    return useState(`trash:${kind}`, () => 0)
}

export function useSoftDelete(kind: TrashKind, onChanged: () => unknown) {
    const api = useApi()
    const toast = useToast()
    const tick = useTrashTick(kind)

    async function restore(ids: string[]) {
        try {
            await api(`/api/trash/${kind}/restore`, {method: 'POST', body: {ids}})
        } catch (e: any) {
            toast.add({title: 'Не удалось вернуть', description: e?.data?.message, color: 'error'})
        }
        tick.value++
        await onChanged()
    }

    async function remove(ids: string[], title?: string) {
        if (!ids.length) return
        try {
            await api(`/api/trash/${kind}/delete`, {method: 'POST', body: {ids}})
        } catch (e: any) {
            toast.add({title: 'Не удалось удалить', description: e?.data?.message, color: 'error'})
            return
        }
        tick.value++
        await onChanged()
        toast.add({
            title: ids.length === 1 ? TRASH_LABEL[kind].deleted : `Удалено: ${ids.length}`,
            description: title,
            color: 'warning',
            duration: 5000,
            actions: [{
                label: 'Отменить',
                icon: 'i-lucide-undo-2',
                color: 'neutral',
                variant: 'outline',
                onClick: () => { restore(ids) },
            }],
        })
    }

    return {remove, restore}
}
