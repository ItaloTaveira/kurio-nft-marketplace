import { delay, http, HttpResponse } from 'msw'
import { connectionInputSchema, quoteInputSchema, submitOrderSchema } from '@/shared/contracts/checkout'
import { AuthError, requireSession } from '@/mocks/database/auth'
import { CartError, withCartLock } from '@/mocks/database/cart'
import { checkoutContext, checkoutScenario, connectWallet, disconnectWallet, createQuote, submitOrder, getOrder } from '@/mocks/database/checkout'

async function respond(request: Request, work: () => unknown, submit = false) {
  const scenario = checkoutScenario()
  await delay(scenario === 'slow' ? 1800 : 250)
  if (scenario === 'offline') return HttpResponse.error()
  try {
    return await withCartLock(() => {
      requireSession(request)
      if (scenario === 'error') return HttpResponse.json({ code: 'CHECKOUT_UNAVAILABLE', message: 'Não foi possível consultar o pagamento. Tente novamente.' }, { status: 503 })
      const result = work()
      if (submit && scenario === 'timeout-after-submit') return HttpResponse.error()
      return HttpResponse.json(result as Record<string, unknown>)
    })
  } catch (error) {
    if (error instanceof AuthError || error instanceof CartError) return HttpResponse.json({ code: error.code, message: error.message }, { status: error.status })
    return HttpResponse.json({ code: 'CHECKOUT_STORAGE_ERROR', message: 'Não foi possível acessar o pedido neste navegador. Consulte a tentativa antes de reenviar.' }, { status: 503 })
  }
}
const invalid = (message: string) => HttpResponse.json({ code: 'VALIDATION_ERROR', message }, { status: 422 })
export const checkoutHandlers = [
  http.get('*/api/checkout', ({ request }) => respond(request, () => checkoutContext(request))),
  http.post('*/api/checkout/connections', async ({ request }) => {
    const parsed = connectionInputSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return invalid('Confira a carteira, rede e provedor selecionados.')
    return respond(request, () => connectWallet(request, parsed.data))
  }),
  http.delete('*/api/checkout/connections/:id', ({ request, params }) => respond(request, () => disconnectWallet(request, String(params.id)))),
  http.post('*/api/checkout/quotes', async ({ request }) => {
    const parsed = quoteInputSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return invalid(parsed.error.issues[0].message)
    return respond(request, () => createQuote(request, parsed.data))
  }),
  http.post('*/api/orders', async ({ request }) => {
    const parsed = submitOrderSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return invalid('Revise o pedido antes de enviar.')
    return respond(request, () => submitOrder(request, parsed.data.quoteId, request.headers.get('Idempotency-Key') ?? ''), true)
  }),
  http.get('*/api/orders/by-key/:key', ({ request, params }) => respond(request, () => getOrder(request, String(params.key), true))),
  http.get('*/api/orders/:id', ({ request, params }) => respond(request, () => getOrder(request, String(params.id)))),
]
