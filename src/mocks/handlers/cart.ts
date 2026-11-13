import { AuthError, cartOwner } from '@/mocks/database/auth'
import { delay, http, HttpResponse } from 'msw'
import { addCartItemSchema, cartCouponSchema, cartQuantitySchema, type CartResponse } from '@/shared/contracts/cart'
import { addItem, assertVersion, cartResponse, readCart, removeItem, setCoupon, updateQuantity, acceptPrices, withCartLock, CartError } from '@/mocks/database/cart'
import { getCartScenario } from '@/mocks/scenarios/cart'

async function respond(request: Request, mutation: boolean, work: () => CartResponse) {
  const scenario = getCartScenario()
  await delay(scenario === 'slow' ? 1800 : scenario === 'mutation-error' && mutation ? 1200 : 300)
  if (scenario === 'offline') return HttpResponse.error()
  if (scenario === 'error' || (scenario === 'mutation-error' && mutation)) return HttpResponse.json({ code: 'CART_UNAVAILABLE', message: 'Não foi possível atualizar o carrinho. Tente novamente.' }, { status: 503 })
  try {
    const response = await withCartLock(work)
    return HttpResponse.json(response, { headers: { ETag: `"${response.version}"` } })
  } catch (error) {
    if (error instanceof CartError || error instanceof AuthError) return HttpResponse.json({ code: error.code, message: error.message }, { status: error.status })
    console.error('Falha no armazenamento do carrinho', request.method, error)
    return HttpResponse.json({ code: 'CART_STORAGE_ERROR', message: 'Não foi possível salvar o carrinho neste navegador.' }, { status: 503 })
  }
}
const invalidBody = () => HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Confira os dados enviados.' }, { status: 422 })
export const cartHandlers = [
  http.get('*/api/cart', ({ request }) => respond(request, false, () => cartResponse(readCart(cartOwner(request))))),
  http.post('*/api/cart/items', async ({ request }) => {
    const body = addCartItemSchema.safeParse(await request.json().catch(() => null))
    if (!body.success) return invalidBody()
    return respond(request, true, () => addItem(readCart(cartOwner(request)), body.data, request.headers.get('Idempotency-Key') ?? ''))
  }),
  http.patch('*/api/cart/items/:itemId', async ({ request, params }) => {
    const body = cartQuantitySchema.safeParse(await request.json().catch(() => null))
    if (!body.success) return invalidBody()
    return respond(request, true, () => { const record = readCart(cartOwner(request)); assertVersion(record, request.headers.get('If-Match')); return updateQuantity(record, String(params.itemId), body.data.quantity) })
  }),
  http.delete('*/api/cart/items/:itemId', ({ request, params }) => respond(request, true, () => { const record = readCart(cartOwner(request)); assertVersion(record, request.headers.get('If-Match')); return removeItem(record, String(params.itemId)) })),
  http.put('*/api/cart/coupon', async ({ request }) => {
    const body = cartCouponSchema.safeParse(await request.json().catch(() => null))
    if (!body.success) return invalidBody()
    return respond(request, true, () => { const record = readCart(cartOwner(request)); assertVersion(record, request.headers.get('If-Match')); return setCoupon(record, body.data.code) })
  }),
  http.delete('*/api/cart/coupon', ({ request }) => respond(request, true, () => { const record = readCart(cartOwner(request)); assertVersion(record, request.headers.get('If-Match')); return setCoupon(record, null) })),
  http.post('*/api/cart/quote/accept', ({ request }) => respond(request, true, () => { const record = readCart(cartOwner(request)); assertVersion(record, request.headers.get('If-Match')); return acceptPrices(record) })),
]
