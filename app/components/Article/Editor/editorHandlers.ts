import type {Editor} from '@tiptap/vue-3'
import type {EditorCustomHandlers} from '@nuxt/ui'

function makeImageAlignHandler(align: 'left' | 'center' | 'right') {
    return {
        canExecute: (editor: Editor) => editor.isActive('image'),
        execute: (editor: Editor) =>
            editor.chain().focus().updateAttributes('image', {class: `align-${align}`}),
        isActive: (editor: Editor) => editor.isActive('image', {class: `align-${align}`}),
        isDisabled: (editor: Editor) => !editor.isActive('image')
    }
}

function makeInsertHandler(type: string, attrs?: Record<string, any>) {
  return {
    canExecute: (editor: Editor) => editor.can().insertContent({ type, attrs }),
    execute: (editor: Editor) => editor.chain().focus().insertContent({ type, attrs }),
    isActive: () => false,
    isDisabled: () => false,
  }
}

export const customHandlers = {
    imageAlignLeft: makeImageAlignHandler('left'),
    imageAlignCenter: makeImageAlignHandler('center'),
    imageAlignRight: makeImageAlignHandler('right'),

    imageUpload: {
        canExecute: (editor: Editor) => editor.can().insertContent({type: 'imageUpload'}),
        execute: (editor: Editor) => editor.chain().focus().insertContent({type: 'imageUpload'}),
        isActive: (editor: Editor) => editor.isActive('imageUpload'),
        isDisabled: () => false,
    },
    spacerVSmall: makeInsertHandler('spacerVertical', {height: 16}),
    spacerVMedium: makeInsertHandler('spacerVertical', {height: 40}),
    spacerVLarge: makeInsertHandler('spacerVertical', {height: 80}),

    spacerHSmall: makeInsertHandler('spacerHorizontal', {width: 16}),
    spacerHMedium: makeInsertHandler('spacerHorizontal', {width: 40}),
    spacerHLarge: makeInsertHandler('spacerHorizontal', {width: 80}),

    invisibleDivider: makeInsertHandler('invisibleDivider'),

} satisfies EditorCustomHandlers
