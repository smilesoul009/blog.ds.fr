import {Node, mergeAttributes} from '@tiptap/core'
import {VueNodeViewRenderer} from '@tiptap/vue-3'
import SpacerVerticalNode from './SpacerVerticalNode.vue'

export const SpacerVertical = Node.create({
    name: 'spacerVertical',
    group: 'block',
    atom: true,

    addAttributes() {
        return {height: {default: 40}}
    },

    parseHTML() {
        return [{tag: 'div[data-type="spacer-vertical"]'}]
    },

    renderHTML({HTMLAttributes}) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'spacer-vertical',
            style: `height: ${HTMLAttributes.height}px;`,
        })]
    },

    addNodeView() {
        return VueNodeViewRenderer(SpacerVerticalNode)
    },
})