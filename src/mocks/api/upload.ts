import { http, type HttpHandler } from 'msw'
import { success } from '../utils/response'

function generateMockUrl(file: File): string {
  const objectUrl = URL.createObjectURL(file)
  return objectUrl
}

export const uploadHandlers: HttpHandler[] = [
  http.post('/api/upload', async ({ request }) => {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const urls = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: generateMockUrl(file),
    }))
    return success(urls.length === 1 ? urls[0] : urls)
  }),

  http.post('/api/upload/base64', async ({ request }) => {
    const { base64, type } = await request.json() as { base64?: string; type?: string }
    if (!base64) return success({ url: '' })
    return success({ url: base64, type: type || 'image' })
  }),
]
