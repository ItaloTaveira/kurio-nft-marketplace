import { http } from '@/shared/api/http'
import { checkoutContextSchema, checkoutQuoteSchema, connectionSchema, orderSchema, type CheckoutSelection, type ConnectionInput } from '@/shared/contracts/checkout'
const headers = (token: string) => ({ Authorization: `Bearer ${token}` })
export async function getCheckout(token: string, signal: AbortSignal) { return checkoutContextSchema.parse((await http.get('/checkout', { signal, headers: headers(token) })).data) }
export async function getOrder(token: string, id: string, signal: AbortSignal, byKey = false) { return orderSchema.parse((await http.get(`/orders/${byKey ? 'by-key/' : ''}${encodeURIComponent(id)}`, { signal, headers: headers(token) })).data) }
export type CheckoutAction =
  | { type: 'connect'; input: ConnectionInput }
  | { type: 'disconnect'; id: string }
  | { type: 'quote'; input: CheckoutSelection & { connectionId: string } }
  | { type: 'submit'; quoteId: string; key: string }
export async function checkoutAction(token: string, action: CheckoutAction) {
  const config = { headers: headers(token) }
  if (action.type === 'connect') return { type: 'connection' as const, data: connectionSchema.parse((await http.post('/checkout/connections', action.input, config)).data) }
  if (action.type === 'disconnect') { await http.delete(`/checkout/connections/${encodeURIComponent(action.id)}`, config); return { type: 'disconnected' as const } }
  if (action.type === 'quote') return { type: 'quote' as const, data: checkoutQuoteSchema.parse((await http.post('/checkout/quotes', action.input, config)).data) }
  return { type: 'order' as const, data: orderSchema.parse((await http.post('/orders', { quoteId: action.quoteId }, { headers: { ...headers(token), 'Idempotency-Key': action.key } })).data) }
}
