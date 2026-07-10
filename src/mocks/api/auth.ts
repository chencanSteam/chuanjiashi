import { http, type HttpHandler } from 'msw'
import { success, fail, unauthorized } from '../utils/response'
import { getItem, setItem, removeItem, generateId, storeKeys } from '../utils/store'
import { findPartnerByInviteCode } from './partner'
import type { User, PartnerCustomer } from '../types'

const TOKEN_KEY = 'cj_token'

function createUser(phone: string): User {
  return {
    id: generateId(),
    phone,
    nickname: `用户${phone.slice(-4)}`,
    inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    agreementAccepted: false,
    privacyAccepted: false,
    createdAt: new Date().toISOString(),
  }
}

function findUserByPhone(phone: string): User | undefined {
  const users = getItem<User[]>(storeKeys.users, [])
  return users.find(u => u.phone === phone)
}

function saveUser(user: User): void {
  const users = getItem<User[]>(storeKeys.users, [])
  const idx = users.findIndex(u => u.id === user.id)
  if (idx >= 0) {
    users[idx] = user
  } else {
    users.push(user)
  }
  setItem(storeKeys.users, users)
}

function getCurrentUser(): User | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  return getItem<User | null>(storeKeys.currentUser, null)
}

function setToken(user: User): string {
  const token = `mock_token_${user.id}_${Date.now()}`
  localStorage.setItem(TOKEN_KEY, token)
  setItem(storeKeys.currentUser, user)
  return token
}

export const authHandlers: HttpHandler[] = [
  http.post('/api/auth/send-code', async ({ request }) => {
    const { phone } = await request.json() as { phone?: string }
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return fail('请输入正确的手机号')
    }
    return success({ phone, code: '123456', expire: 300 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const { phone, code, inviteCode } = await request.json() as { phone?: string; code?: string; inviteCode?: string }
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return fail('请输入正确的手机号')
    }
    if (code !== '123456') {
      return fail('验证码错误')
    }

    let user = findUserByPhone(phone)
    if (!user) {
      const newUser = createUser(phone)
      if (inviteCode) {
        // 优先查找合伙人邀请码
        const partner = findPartnerByInviteCode(inviteCode)
        if (partner) {
          newUser.invitedBy = partner.userId
          // 绑定为合伙人客户
          const customers = getItem<PartnerCustomer[]>(storeKeys.partnerCustomers, [])
          if (!customers.find((c) => c.userId === newUser.id && c.partnerId === partner.id)) {
            customers.push({
              id: generateId(),
              partnerId: partner.id,
              userId: newUser.id,
              userName: newUser.nickname,
              userPhone: newUser.phone,
              bindType: 'invite_code',
              hasPaid: false,
              totalOrderAmount: 0,
              createdAt: new Date().toISOString(),
            })
            setItem(storeKeys.partnerCustomers, customers)
          }
        } else {
          // 否则查找用户邀请码
          const inviter = getItem<User[]>(storeKeys.users, []).find(u => u.inviteCode === inviteCode)
          if (inviter) newUser.invitedBy = inviter.id
        }
      }
      saveUser(newUser)
      user = newUser
    }

    const token = setToken(user)
    return success({ user, token }, '登录成功')
  }),

  http.post('/api/auth/logout', async () => {
    localStorage.removeItem(TOKEN_KEY)
    removeItem(storeKeys.currentUser)
    return success(null, '已退出登录')
  }),

  http.get('/api/auth/me', async () => {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    return success(user)
  }),

  http.post('/api/auth/agreement', async ({ request }) => {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    const { type } = await request.json() as { type?: 'agreement' | 'privacy' }
    if (type === 'agreement') user.agreementAccepted = true
    if (type === 'privacy') user.privacyAccepted = true
    saveUser(user)
    setItem(storeKeys.currentUser, user)
    return success(user)
  }),
]
