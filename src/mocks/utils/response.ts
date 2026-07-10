import { HttpResponse } from 'msw'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: number
}

export function success<T>(data: T, message = 'success'): Response {
  return HttpResponse.json<ApiResponse<T>>({
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  })
}

export function fail(message: string, code = 400): Response {
  return HttpResponse.json<ApiResponse<null>>({
    code,
    message,
    data: null,
    timestamp: Date.now(),
  }, { status: code })
}

export function unauthorized(message = '请先登录'): Response {
  return fail(message, 401)
}

export function notFound(message = '资源不存在'): Response {
  return fail(message, 404)
}
