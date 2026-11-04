import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import SpacerHorizontalNode from './SpacerHorizontalNode.vue'

export const SpacerHorizontal = Node.create({
    name: 'spacerHorizontal',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return { width: { default: 40 } }
    },

    parseHTML() {
        return [{ tag: 'span[data-type="spacer-horizontal"]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, {
            'data-type': 'spacer-horizontal',
            style: `display: inline-block; width: ${HTMLAttributes.width}px;`,
        })]
    },

    addNodeView() {
        return VueNodeViewRenderer(SpacerHorizontalNode)
    },
})