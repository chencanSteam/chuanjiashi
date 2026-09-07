import type { OrderAddress } from '../mocks/types'

export interface MobileAddress extends OrderAddress {
  id: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

const legacyKey = 'cj_last_address'
const keyFor = (phone?: string) => `cj_addresses_${phone || 'guest'}`
const makeId = () => `addr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`

export function loadAddresses(phone?: string): MobileAddress[] {
  try {
    const raw = localStorage.getItem(keyFor(phone))
    if (raw) {
      const parsed = JSON.parse(raw) as MobileAddress[]
      if (Array.isArray(parsed)) return parsed
    }
    const legacy = localStorage.getItem(legacyKey)
    if (!legacy) return []
    const address = JSON.parse(legacy) as Partial<OrderAddress>
    if (!address.name && !address.detail) return []
    const now = new Date().toISOString()
    const migrated: MobileAddress = { id: makeId(), name: address.name || '', phone: address.phone || phone || '', province: address.province || '', city: address.city || '', district: address.district || '', detail: address.detail || '', isDefault: true, createdAt: now, updatedAt: now }
    saveAddresses(phone, [migrated])
    return [migrated]
  } catch {
    return []
  }
}

export function saveAddresses(phone: string | undefined, addresses: MobileAddress[]): void {
  localStorage.setItem(keyFor(phone), JSON.stringify(addresses))
  const defaultAddress = addresses.find((item) => item.isDefault) || addresses[0]
  if (defaultAddress) {
    const { id: _id, isDefault: _default, createdAt: _created, updatedAt: _updated, ...legacy } = defaultAddress
    localStorage.setItem(legacyKey, JSON.stringify(legacy))
  } else {
    localStorage.removeItem(legacyKey)
  }
}

export function createAddress(input: OrderAddress, isDefault: boolean): MobileAddress {
  const now = new Date().toISOString()
  return { ...input, id: makeId(), isDefault, createdAt: now, updatedAt: now }
}
