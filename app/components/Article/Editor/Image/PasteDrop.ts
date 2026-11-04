import type { EditorProps } from '@tiptap/pm/view'
import type { Editor } from '@tiptap/vue-3'
import { uploadImage } from './upload'

function findPlaceholder(editor: Editor, uploadId: string): number | null {
    let found: number | null = null

    editor.state.doc.descendants((node, pos) => {
        if (found !== null) return false
        if (node.type.name === 'imageUploadingPlaceholder' && node.attrs.uploadId === uploadId) {
            found = pos
            return false
        }
        return true
    })

    return found
}

function insertWithPlaceholder(editor: Editor, file: File, pos: number) {
    const uploadId = `up-${Date.now()}-${Math.random().toString(36).slice(2)}`

    editor
        .chain()
        .insertContentAt(pos, { type: 'imageUploadingPlaceholder', attrs: { uploadId } })
        .run()

    uploadImage(file)
        .then((url) => {
            const at = findPlaceholder(editor, uploadId)
            if (at === null) return
            editor.chain().deleteRange({ from: at, to: at + 1 }).setImage({ src: url }).run()
        })
        .catch((e) => {
            console.error('Загрузка не удалась', e)
            const at = findPlaceholder(editor, uploadId)
            if (at !== null) editor.chain().deleteRange({ from: at, to: at + 1 }).run()
        })
}

export function createImagePasteDropProps(
    getEditor: () => Editor | undefined,
): Partial<EditorProps> {
    return {
        handlePaste(_view, event) {
            const item = Array.from(event.clipboardData?.items ?? [])
                .find(i => i.type.startsWith('image/'))
            if (!item) return false

            const file = item.getAsFile()
            const editor = getEditor()
            if (!file || !editor) return false

            insertWithPlaceholder(editor, file, editor.state.selection.from)
            return true
        },

        handleDrop(view, event) {
            const file = event.dataTransfer?.files?.[0]
            if (!file?.type.startsWith('image/')) return false

            event.preventDefault()

            const editor = getEditor()
            if (!editor) return false

            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
            insertWithPlaceholder(editor, file, coords?.pos ?? editor.state.selection.from)
            return true
        },
    }
}