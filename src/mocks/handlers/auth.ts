import { delay, http, HttpResponse } from 'msw'
import { loginSchema, registerSchema, socialLoginSchema } from '@/shared/contracts/auth'
import { AuthError, authenticate, authenticateSocial, logout, resolveSession } from '@/mocks/database/auth'
import { CartError, withCartLock } from '@/mocks/database/cart'
async function respond(work: () => unknown | Promise<unknown>) {
  const scenario = localStorage.getItem('kurio:auth-scenario')
  await delay(scenario === 'slow' ? 1800 : 250)
  if (scenario === 'offline') return HttpResponse.error()
  if (scenario === 'error') return HttpResponse.json({ message: 'O serviço de conta está indisponível. Tente novamente.' }, { status: 503 })
  try { return HttpResponse.json(await withCartLock(work) as Record<string, unknown> | null) }
  catch (error) {
    if (error instanceof AuthError || error instanceof CartError) return HttpResponse.json({ code: error.code, message: error.message }, { status: error.status })
    return HttpResponse.json({ message: 'Não foi possível acessar os dados de conta neste navegador.' }, { status: 503 })
  }
}
export const authHandlers = [
  http.post('*/api/auth/social', async ({ request }) => {
    const parsed = socialLoginSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Escolha Google ou Facebook para a demonstração.' }, { status: 422 })
    return respond(() => authenticateSocial(parsed.data.provider))
  }),
  http.get('*/api/auth/session', ({ request }) => respond(() => resolveSession(request))),
  ...(['login', 'register'] as const).map(operation => http.post(`*/api/auth/${operation}`, async ({ request }) => {
    const schema = operation === 'register' ? registerSchema : loginSchema
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return HttpResponse.json({ code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message }, { status: 422 })
    return respond(() => authenticate(parsed.data, operation === 'register'))
  })),
  http.post('*/api/auth/logout', ({ request }) => respond(() => { logout(request); return { ok: true } })),
]
