import { getItem, setItem, storeKeys } from '../utils/store'
import { defaultProducts } from '../data/seed'
import type { ProductPackage } from '../types'

function ensureProducts(): ProductPackage[] {
  const products = getItem<ProductPackage[]>(storeKeys.products, [])
  if (products.length === 0) {
    setItem(storeKeys.products, defaultProducts)
    return defaultProducts
  }
  return products
}

export function increaseProductSales(productId: string, amount: number = 1): void {
  const products = ensureProducts()
  const idx = products.findIndex((p) => p.id === productId)
  if (idx >= 0) {
    products[idx].sales = (products[idx].sales || 0) + amount
    setItem(storeKeys.products, products)
  }
}
