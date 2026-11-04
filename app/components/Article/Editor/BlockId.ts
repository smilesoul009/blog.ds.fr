import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import {REVIEWABLE_BLOCK_TYPES} from "#shared/constants/blocks";

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    return `b-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const BlockId = Extension.create({
    name: 'blockId',

    addGlobalAttributes() {
        return [{
            types: [...REVIEWABLE_BLOCK_TYPES],
            attributes: {
                blockId: {
                    default: null,
                    keepOnSplit: false,
                    parseHTML: (element: HTMLElement) => element.getAttribute('data-block-id'),
                    renderHTML: (attributes: { blockId?: string }) =>
                        attributes.blockId ? { 'data-block-id': attributes.blockId } : {},
                },
            },
        }]
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('blockId'),

                appendTransaction: (transactions, _oldState, newState) => {
                    if (!transactions.some(tr => tr.docChanged)) return null

                    const tr = newState.tr
                    const seen = new Set<string>()
                    let modified = false

                    newState.doc.descendants((node, pos) => {
                        if (!REVIEWABLE_BLOCK_TYPES.some(t => t === node.type.name)) return
                        const id = node.attrs.blockId

                        if (!id || seen.has(id)) {
                            tr.setNodeAttribute(pos, 'blockId', generateId())
                            modified = true
                        } else {
                            seen.add(id)
                        }
                    })

                    return modified ? tr : null
                },
            }),
        ]
    },
})