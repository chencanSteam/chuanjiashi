import { http, type HttpHandler } from 'msw'
import { success } from '../utils/response'
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

export const productHandlers: HttpHandler[] = [
  http.get('/api/products', async () => {
    return success(ensureProducts())
  }),

  http.get('/api/products/:id', async ({ params }) => {
    const products = ensureProducts()
    const product = products.find((p) => p.id === params.id)
    return success(product)
  }),
]
