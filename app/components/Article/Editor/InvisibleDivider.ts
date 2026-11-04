import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import InvisibleDividerNode from './InvisibleDividerNode.vue'

export const InvisibleDivider = Node.create({
    name: 'invisibleDivider',
    group: 'block',
    atom: true,

    addAttributes() {
        return { height: { default: 32 } }
    },

    parseHTML() {
        return [{ tag: 'div[data-type="invisible-divider"]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'invisible-divider',
            style: `height: ${HTMLAttributes.height}px; clear: both;`,
        })]
    },

    addNodeView() {
        return VueNodeViewRenderer(InvisibleDividerNode)
    },
})