import type {EditorToolbarItem} from '@nuxt/ui'
import type {customHandlers} from './editorHandlers'

export const toolbarItems = [
    {kind: 'undo', icon: 'i-lucide-undo-2', tooltip: {text: 'Отменить'}},
    {kind: 'redo', icon: 'i-lucide-redo-2', tooltip: {text: 'Повторить'}},

    {kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: {text: 'Жирный'}},
    {kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: {text: 'Курсив'}},

    {kind: 'heading', level: 1, icon: 'i-lucide-heading-1', tooltip: {text: 'Заголовок 1'}},
    {kind: 'heading', level: 2, icon: 'i-lucide-heading-2', tooltip: {text: 'Заголовок 2'}},
    {kind: 'heading', level: 3, icon: 'i-lucide-heading-3', tooltip: {text: 'Заголовок 3'}},

    {kind: 'bulletList', icon: 'i-lucide-list', tooltip: {text: 'Маркированный список'}},
    {kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: {text: 'Нумерованный список'}},
    {kind: 'blockquote', icon: 'i-lucide-quote', tooltip: {text: 'Цитата'}},
    {kind: 'horizontalRule', icon: 'i-lucide-minus', tooltip: {text: 'Разделитель'}},

    {kind: 'textAlign', align: 'left', icon: 'i-lucide-align-left', tooltip: {text: 'По левому краю'}},
    {kind: 'textAlign', align: 'center', icon: 'i-lucide-align-center', tooltip: {text: 'По центру'}},
    {kind: 'textAlign', align: 'right', icon: 'i-lucide-align-right', tooltip: {text: 'По правому краю'}},
    {kind: 'textAlign', align: 'justify', icon: 'i-lucide-align-justify', tooltip: {text: 'По ширине'}},

    {kind: 'imageAlignLeft', icon: 'i-lucide-align-horizontal-justify-start', tooltip: {text: 'Картинка слева'}},
    {kind: 'imageAlignCenter', icon: 'i-lucide-align-horizontal-justify-center', tooltip: {text: 'Картинка по центру'}},
    {kind: 'imageAlignRight', icon: 'i-lucide-align-horizontal-justify-end', tooltip: {text: 'Картинка справа'}},
    {kind: 'imageUpload', icon: 'i-lucide-image-plus', tooltip: {text: 'Вставить изображение'}},

    {kind: 'invisibleDivider', icon: 'i-lucide-separator-horizontal', tooltip: {text: 'Невидимый разделитель'}},

    {
        icon: 'i-lucide-move-vertical',
        tooltip: {text: 'Вертикальный отступ'},
        content: {align: 'start'},
        items: [
            {kind: 'spacerVSmall', label: 'Маленький (16px)'},
            {kind: 'spacerVMedium', label: 'Средний (40px)'},
            {kind: 'spacerVLarge', label: 'Большой (80px)'},
        ],
    },
    {
        icon: 'i-lucide-move-horizontal',
        tooltip: {text: 'Горизонтальный сдвиг'},
        content: {align: 'start'},
        items: [
            {kind: 'spacerHSmall', label: 'Маленький (16px)'},
            {kind: 'spacerHMedium', label: 'Средний (40px)'},
            {kind: 'spacerHLarge', label: 'Большой (80px)'},
        ],
    },
] satisfies EditorToolbarItem<typeof customHandlers>[]
