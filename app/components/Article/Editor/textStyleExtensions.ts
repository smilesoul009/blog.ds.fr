import { TextStyle, FontFamily, FontSize, Color } from '@tiptap/extension-text-style'

export const textStyleExtensions = [
  TextStyle,
  FontFamily.configure({ types: ['textStyle'] }),
  FontSize.configure({ types: ['textStyle'] }),
  Color.configure({ types: ['textStyle'] })
]
