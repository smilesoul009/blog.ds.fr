export default defineNuxtPlugin(() => {
    const isEditable = (target: EventTarget | null) =>
        target instanceof Element &&
        !!target.closest('input, textarea, [contenteditable="true"]')

    const isProtected = (target: EventTarget | null) =>
        target instanceof Element && !!target.closest('.no-copy')

    for (const type of ['copy', 'cut', 'contextmenu', 'dragstart'] as const) {
        document.addEventListener(type, (event) => {
            if (isProtected(event.target) && !isEditable(event.target)) {
                event.preventDefault()
            }
        })
    }
})