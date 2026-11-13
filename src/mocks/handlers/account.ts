import { demoWalletAddress } from '@/mocks/database/demo-wallet'
import { delay, http, HttpResponse } from 'msw'
import { demoWalletInputSchema, profileUpdateSchema, walletFieldsSchema, walletPreferencesSchema } from '@/shared/contracts/account'
import { AuthError, requireSession } from '@/mocks/database/auth'
import { readProfile, updateProfile, readWallets, updateWallet, setWalletPreference } from '@/mocks/database/account'
import { withCartLock } from '@/mocks/database/cart'

async function respond(request: Request, mutation: boolean, work: () => unknown | Promise<unknown>) {
  const scenario = localStorage.getItem('kurio:account-scenario')
  await delay(scenario === 'slow' ? 1800 : 300)
  if (scenario === 'offline') return HttpResponse.error()
  try {
    return await withCartLock(async () => {
      requireSession(request)
      if (scenario === 'error' || (mutation && scenario === 'mutation-error')) return HttpResponse.json({ message: 'O serviço de perfil e carteiras está indisponível. Tente novamente.' }, { status: 503 })
      const result = await work() as { version?: number }
      return HttpResponse.json(result, { headers: result.version === undefined ? undefined : { ETag: `"${result.version}"` } })
    })
  } catch (error) {
    if (error instanceof AuthError) return HttpResponse.json({ code: error.code, message: error.message }, { status: error.status })
    return HttpResponse.json({ message: 'Não foi possível salvar ou consultar os dados neste navegador.' }, { status: 503 })
  }
}
const invalid = (message: string) => HttpResponse.json({ code: 'VALIDATION_ERROR', message }, { status: 422 })
export const accountHandlers = [
  http.post('*/api/wallets/demo-address', async ({ request }) => {
    const parsed = demoWalletInputSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return invalid('Selecione uma rede para gerar o endereço fictício.')
    return respond(request, true, () => ({ network: parsed.data.network, address: demoWalletAddress(parsed.data.network) }))
  }),
  http.get('*/api/profile', ({ request }) => respond(request, false, () => readProfile(request))),
  http.patch('*/api/profile', async ({ request }) => {
    const parsed = profileUpdateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return invalid(parsed.error.issues[0].message)
    return respond(request, true, () => updateProfile(request, parsed.data))
  }),
  http.get('*/api/wallets', ({ request }) => respond(request, false, () => readWallets(request))),
  http.patch('*/api/wallets/preferences', async ({ request }) => {
    const parsed = walletPreferencesSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return invalid('Confira a opção da carteira secundária.')
    return respond(request, true, () => setWalletPreference(request, parsed.data.secondarySameAsPrimary))
  }),
  http.put('*/api/wallets/:slot', async ({ request, params }) => {
    if (params.slot !== 'primary' && params.slot !== 'secondary') return HttpResponse.json({ message: 'Carteira não encontrada.' }, { status: 404 })
    const slot = params.slot
    const parsed = walletFieldsSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return invalid(parsed.error.issues[0].message)
    return respond(request, true, () => updateWallet(request, slot, parsed.data))
  }),
]
