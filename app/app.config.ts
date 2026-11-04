export default defineAppConfig({
    ui: {
        colors: {
            primary: 'neutral',
            neutral: 'slate',
        },

        button: {
            slots: {
                base: 'font-normal rounded-xs transition-all duration-150',
            },
            compoundVariants: [
                {
                    color: 'neutral',
                    variant: 'solid',
                    class: [
                        'bg-control-base text-highlighted',
                        'ring ring-inset ring-accented',
                        'hover:bg-control-hover hover:shadow-control',
                        'active:bg-sub-300',
                        'disabled:bg-control-base aria-disabled:bg-control-base',
                    ].join(' '),
                },
                {
                    color: 'primary',
                    variant: 'soft',
                    class: 'bg-sub-400! text-highlighted! hover:bg-sub-400! active:bg-sub-400!',
                },
            ],
            defaultVariants: {
                color: 'neutral',
                variant: 'solid',
                size: 'lg',
            },
        },

        input: {
            slots: {base: 'field-base'},
            defaultVariants: {size: 'md'},
        },
        select: {
            slots: {
                base: 'field-base',
                content: 'rounded-xs',
                item: 'rounded-xs before:rounded-xs',
            },
            defaultVariants: {size: 'md'},
        },
        textarea: {
            slots: {base: 'field-base'},
            defaultVariants: {size: 'md'},
        },
        modal: {
            slots: {
                overlay: 'bg-[rgb(40_45_50_/_0.55)]',
                content: 'bg-sub-100 ring ring-default rounded-sm',
                header: 'px-4 py-3 border-b border-default',
                title: 'font-medium text-highlighted',
                body: 'p-4',
                footer: 'px-4 py-3 border-t border-default',
            },
        },

        popover: {
            slots: {
                content: 'bg-sub-100 ring ring-default rounded-sm shadow-lg',
            },
        },

        dropdownMenu: {
            slots: {
                content: 'bg-sub-100 ring ring-default rounded-sm shadow-lg',
                item: 'rounded-xs',
            },
        },

        selectMenu: {
            slots: {
                content: 'bg-sub-100 ring ring-default rounded-sm shadow-lg',
                item: 'rounded-xs',
            },
        },

        tooltip: {
            slots: {
                content: 'bg-[var(--color-sub-550)] text-inverted rounded-xs',
            },
        },

        toast: {
            slots: {
                root: 'bg-sub-100 ring ring-default rounded-sm',
            },
        },

    },
})