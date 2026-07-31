const BASE_URL = ''

// 拼接查询串：跳过 undefined / null / 空字符串，避免被序列化成 "undefined"
export function toQuery(params?: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })
  return search.toString()
}

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

  // 先以文本形式读取，避免空响应导致 res.json() 抛错
  const text = await res.text()

  // 204 / 空响应体：视为无数据
  if (!text) {
    if (!res.ok) {
      throw new Error(`请求失败 (${res.status})`)
    }
    return null as T
  }

  let json: ApiResult<T>
  try {
    json = JSON.parse(text) as ApiResult<T>
  } catch {
    // 返回的不是 JSON（例如 HTML 错误页）
    // eslint-disable-next-line no-console
    console.error('[api] 非 JSON 响应:', url, res.status, text.slice(0, 200))
    throw new Error(`请求失败 (${res.status})`)
  }

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
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: <T>(url: string) => request<T>('DELETE', url),
}

export function uploadFile(files: FileList | File[]): Promise<{ name: string; size: number; type: string; url: string }[]> {
  const formData = new FormData()
  const list = files instanceof FileList ? Array.from(files) : files
  list.forEach(file => formData.append('files', file))
  return api.post('/api/upload', formData)
}
