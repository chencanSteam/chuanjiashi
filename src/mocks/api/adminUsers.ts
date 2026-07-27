import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, storeKeys } from '../utils/store'
import { defaultAdminUsers } from '../data/seed'
import type { AdminUser, CommissionRecord } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function ensureAdminUsers(): AdminUser[] {
  const users = getItem<AdminUser[]>(storeKeys.adminUsers, [])
  if (users.length === 0) {
    setItem(storeKeys.adminUsers, defaultAdminUsers)
    return defaultAdminUsers
  }
  return users
}

export const adminUserHandlers: HttpHandler[] = [
  // 用户列表（关键词/状态过滤）
  http.get('/api/admin/users', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const keyword = url.searchParams.get('keyword') || ''
    const status = url.searchParams.get('status') || 'all'
    let users = ensureAdminUsers()
    if (status !== 'all') users = users.filter((u) => u.status === status)
    if (keyword) {
      const lower = keyword.toLowerCase()
      users = users.filter((u) =>
        u.nickname.toLowerCase().includes(lower) || u.phone.includes(keyword)
      )
    }
    return success(users)
  }),

  // 实名审核列表
  http.get('/api/admin/users/realname', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'pending'
    let users = ensureAdminUsers().filter((u) => u.realNameStatus !== 'none')
    if (status !== 'all') users = users.filter((u) => u.realNameStatus === status)
    return success(users)
  }),

  // 用户详情（含推广关系、佣金明细）
  http.get('/api/admin/users/:id', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const users = ensureAdminUsers()
    const user = users.find((u) => u.id === params.id)
    if (!user) return notFound('用户不存在')
    // 推广关系：直接邀请的下级用户
    const invitees = users.filter((u) => u.inviterName === user.nickname)
    // 佣金明细
    const commissions = getItem<CommissionRecord[]>(storeKeys.commissions, [])
      .filter((c) => c.userId === user.id)
    return success({ ...user, invitees, commissions })
  }),

  // 禁用/启用
  http.patch('/api/admin/users/:id/status', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { status } = (await request.json()) as { status?: AdminUser['status'] }
    if (!status || !['active', 'disabled'].includes(status)) return fail('状态错误')
    const users = ensureAdminUsers()
    const user = users.find((u) => u.id === params.id)
    if (!user) return notFound('用户不存在')
    user.status = status
    setItem(storeKeys.adminUsers, users)
    return success(user, status === 'active' ? '已启用' : '已禁用')
  }),

  // 实名审核通过/驳回
  http.patch('/api/admin/users/:id/realname', async ({ params, request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const { status } = (await request.json()) as { status?: AdminUser['realNameStatus'] }
    if (!status || !['verified', 'rejected'].includes(status)) return fail('状态错误')
    const users = ensureAdminUsers()
    const user = users.find((u) => u.id === params.id)
    if (!user) return notFound('用户不存在')
    if (user.realNameStatus !== 'pending') return fail('该用户不在待审核状态')
    user.realNameStatus = status
    setItem(storeKeys.adminUsers, users)
    return success(user, status === 'verified' ? '实名审核已通过' : '实名审核已驳回')
  }),
]
