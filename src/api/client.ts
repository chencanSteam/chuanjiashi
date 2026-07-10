const BASE_URL = ''

export interface ApiResult<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const options: RequestInit = {
    method,
    credentials: 'same-origin',
  }
  if (body instanceof FormData) {
    options.body = body
  } else if (body !== undefined) {
    options.headers = {
      'Content-Type': 'application/json',
    }
    options.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE_URL}${url}`, options)
  const json = (await res.json()) as ApiResult<T>
  if (!res.ok || json.code !== 200) {
    const err = new Error(json.message || '请求失败')
    ;(err as any).code = json.code
    throw err
  }
  return json.data
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  delete: <T>(url: string) => request<T>('DELETE', url),
}

export function uploadFile(files: FileList | File[]): Promise<{ name: string; size: number; type: string; url: string }[]> {
  const formData = new FormData()
  const list = files instanceof FileList ? Array.from(files) : files
  list.forEach(file => formData.append('files', file))
  return api.post('/api/upload', formData)
}
