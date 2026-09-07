import { http, type HttpHandler } from 'msw'
import { success, fail, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
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

function saveProducts(products: ProductPackage[]): void {
  setItem(storeKeys.products, products)
}

export function increaseProductSales(productId: string, amount: number = 1): void {
  const products = ensureProducts()
  const idx = products.findIndex((p) => p.id === productId)
  if (idx >= 0) {
    products[idx].sales = (products[idx].sales || 0) + amount
    setItem(storeKeys.products, products)
  }
}

export const productHandlers: HttpHandler[] = [
  // 用户端商城：仅返回上架中的套餐
  http.get('/api/products', async () => {
    return success(ensureProducts().filter((p) => (p.type === 'biography' || p.type === 'book') && p.status !== 'inactive'))
  }),

  // 管理端：全部套餐（含已下架），注意放在 /:id 之前
  http.get('/api/products/all', async () => {
    return success(ensureProducts())
  }),

  http.get('/api/products/:id', async ({ params }) => {
    const products = ensureProducts()
    const product = products.find((p) => p.id === params.id)
    return success(product)
  }),

  // 管理端：新增套餐
  http.post('/api/products', async ({ request }) => {
    const body = (await request.json()) as Partial<ProductPackage>
    if (!body.name?.trim()) return fail('请填写套餐名称')
    if (!body.type || (body.type !== 'biography' && body.type !== 'book')) return fail('当前仅支持 AI传记和实体书商品')
    if (!body.price || Number.isNaN(Number(body.price)) || Number(body.price) <= 0) {
      return fail('请填写正确的价格')
    }
    const products = ensureProducts()
    const product: ProductPackage = {
      id: generateId(),
      type: body.type,
      name: body.name.trim(),
      price: Number(body.price),
      originalPrice: body.originalPrice != null && !Number.isNaN(Number(body.originalPrice)) ? Number(body.originalPrice) : undefined,
      description: body.description?.trim() || '',
      rights: body.rights || [],
      hot: !!body.hot,
      status: 'active',
      headline: body.headline?.trim(),
      subheadline: body.subheadline?.trim(),
      detailBlocks: body.detailBlocks,
      promises: body.promises,
      faqs: body.faqs,
      tags: body.tags,
      sortOrder: body.sortOrder,
      coverImage: body.coverImage,
      gallery: body.gallery,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    products.push(product)
    saveProducts(products)
    return success(product, '套餐新增成功')
  }),

  // 管理端：编辑套餐
  http.put('/api/products/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<ProductPackage>
    const products = ensureProducts()
    const idx = products.findIndex((p) => p.id === params.id)
    if (idx < 0) return notFound('套餐不存在')
    if (!body.name?.trim()) return fail('请填写套餐名称')
    if (body.type && body.type !== 'biography' && body.type !== 'book') return fail('当前仅支持 AI传记和实体书商品')
    if (!body.price || Number.isNaN(Number(body.price)) || Number(body.price) <= 0) {
      return fail('请填写正确的价格')
    }
    products[idx] = {
      ...products[idx],
      type: body.type || products[idx].type,
      name: body.name.trim(),
      price: Number(body.price),
      originalPrice: body.originalPrice != null && !Number.isNaN(Number(body.originalPrice)) ? Number(body.originalPrice) : undefined,
      description: body.description?.trim() || '',
      rights: body.rights || [],
      hot: !!body.hot,
      headline: body.headline?.trim(),
      subheadline: body.subheadline?.trim(),
      detailBlocks: body.detailBlocks,
      promises: body.promises,
      faqs: body.faqs,
      tags: body.tags,
      sortOrder: body.sortOrder,
      coverImage: body.coverImage,
      gallery: body.gallery,
      updatedAt: new Date().toISOString(),
    }
    saveProducts(products)
    return success(products[idx], '套餐已更新')
  }),

  // 管理端：删除套餐
  http.delete('/api/products/:id', async ({ params }) => {
    const products = ensureProducts()
    const next = products.filter((p) => p.id !== params.id)
    if (next.length === products.length) return notFound('套餐不存在')
    saveProducts(next)
    return success(null, '套餐已删除')
  }),

  // 管理端：上下架
  http.patch('/api/products/:id/status', async ({ params, request }) => {
    const { status } = (await request.json()) as { status?: 'active' | 'inactive' }
    if (status !== 'active' && status !== 'inactive') return fail('状态错误')
    const products = ensureProducts()
    const idx = products.findIndex((p) => p.id === params.id)
    if (idx < 0) return notFound('套餐不存在')
    products[idx] = { ...products[idx], status }
    saveProducts(products)
    return success(products[idx], status === 'active' ? '已上架' : '已下架')
  }),
]
