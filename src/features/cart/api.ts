import { http } from '@/shared/api/http'
import { cartResponseSchema, type AddCartItem } from '@/shared/contracts/cart'

export type CartAction =
  | { type: 'add'; item: AddCartItem; operationId: string }
  | { type: 'quantity'; itemId: string; quantity: number; version: number }
  | { type: 'remove'; itemId: string; version: number }
  | { type: 'coupon'; code: string; version: number }
  | { type: 'remove-coupon'; version: number }
  | { type: 'accept-prices'; version: number }

export async function getCart(signal: AbortSignal, owner = 'guest') {
  const { data } = await http.get<unknown>('/cart', { signal, headers: { Authorization: owner === 'guest' ? '' : `Bearer ${owner}` } })
  return cartResponseSchema.parse(data)
}
export async function changeCart(action: CartAction, owner = 'guest') {
  const headers = { Authorization: owner === 'guest' ? '' : `Bearer ${owner}`, ...('version' in action ? { 'If-Match': `"${action.version}"` } : {}) }
  const response = action.type === 'add'
    ? await http.post('/cart/items', action.item, { headers: { ...headers, 'Idempotency-Key': action.operationId } })
    : action.type === 'quantity'
      ? await http.patch(`/cart/items/${encodeURIComponent(action.itemId)}`, { quantity: action.quantity }, { headers })
      : action.type === 'remove'
        ? await http.delete(`/cart/items/${encodeURIComponent(action.itemId)}`, { headers })
        : action.type === 'coupon'
          ? await http.put('/cart/coupon', { code: action.code }, { headers })
          : action.type === 'remove-coupon'
            ? await http.delete('/cart/coupon', { headers })
            : await http.post('/cart/quote/accept', {}, { headers })
  return cartResponseSchema.parse(response.data)
}
