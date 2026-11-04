import { Node, mergeAttributes, Extension } from '@tiptap/core'
import { Image } from '@tiptap/extension-image'
import { REVIEWABLE_BLOCK_TYPES } from '~~/shared/constants/blocks'
type ParsedElement = { getAttribute(name: string): string | null }

export const CustomImageServer = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            class: {
                default: 'align-left',
                parseHTML: (element: ParsedElement) => element.getAttribute('class'),
                renderHTML: (attributes: { class?: string }) =>
                    attributes.class ? { class: attributes.class } : {},
            },
        }
    },
})

export const BlockIdServer = Extension.create({
    name: 'blockId',
    addGlobalAttributes() {
        return [{
            types: [...REVIEWABLE_BLOCK_TYPES],
            attributes: {
                blockId: {
                    default: null,
                    parseHTML: (element: ParsedElement) => element.getAttribute('data-block-id'),
                    renderHTML: (attributes: { blockId?: string }) =>
                        attributes.blockId ? { 'data-block-id': attributes.blockId } : {},
                },
            },
        }]
    },
})

export const SpacerVerticalServer = Node.create({
    name: 'spacerVertical',
    group: 'block',
    atom: true,
    addAttributes() {
        return { height: { default: 40 } }
    },
    parseHTML() {
        return [{ tag: 'div[data-type="spacer-vertical"]' }]
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, {
            'data-type': 'spacer-vertical',
            style: `height: ${HTMLAttributes.height}px;`,
        })]
    },
})

export const SpacerHorizontalServer = Node.create({
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
})

export const InvisibleDividerServer = Node.create({
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
})

export const ImageUploadServer = Node.create({
    name: 'imageUpload',
    group: 'block',
    atom: true,
    parseHTML() {
        return [{ tag: 'div[data-type="image-upload"]' }]
    },
    renderHTML() {
        return ['div', { 'data-type': 'image-upload' }]
    },
})

export const ImageUploadingServer = Node.create({
    name: 'imageUploadingPlaceholder',
    group: 'block',
    atom: true,
    addAttributes() {
        return { uploadId: { default: null } }
    },
    parseHTML() {
        return [{ tag: 'div[data-type="image-uploading"]' }]
    },
    renderHTML() {
        return ['div', { 'data-type': 'image-uploading' }]
    },
})