import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageUploadingNode from './UploadingNode.vue'

const ImageUploadingPlaceholder = Node.create({
    name: 'imageUploadingPlaceholder',
    group: 'block',
    atom: true,

    addAttributes() {
        return { uploadId: { default: null } }
    },

    parseHTML() {
        return [{ tag: 'div[data-type="image-uploading"]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-uploading' })]
    },

    addNodeView() {
        return VueNodeViewRenderer(ImageUploadingNode)
    },
})
 export default ImageUploadingPlaceholder
