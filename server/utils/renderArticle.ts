import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle, FontFamily, FontSize, Color } from '@tiptap/extension-text-style'
import {
    CustomImageServer,
    BlockIdServer,
    SpacerVerticalServer,
    SpacerHorizontalServer,
    InvisibleDividerServer,
    ImageUploadServer,
    ImageUploadingServer,
} from './editorSchema'

export function renderArticleHtml(content: any): string {
    return generateHTML(content, [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        BlockIdServer,
        CustomImageServer,
        SpacerVerticalServer,
        SpacerHorizontalServer,
        InvisibleDividerServer,
        ImageUploadServer,
        ImageUploadingServer,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TextStyle,
        FontFamily,
        FontSize,
        Color,
    ])
}