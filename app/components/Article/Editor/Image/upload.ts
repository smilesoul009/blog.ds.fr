export async function uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const { url } = await $fetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData,
    })

    return url
}