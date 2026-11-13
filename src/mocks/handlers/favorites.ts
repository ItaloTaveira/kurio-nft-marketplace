import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import { AuthError, requireSession } from '@/mocks/database/auth'
import { withCartLock } from '@/mocks/database/cart'
import { catalogFixtures } from '@/mocks/fixtures/catalog'
import { resolveMarketplaceNft } from '@/mocks/database/marketplace'
const recordSchema = z.object({ version: z.number().int().nonnegative(), ids: z.array(z.string()).max(200) })
async function respond(request: Request, nftId?: string, add = true) {
  const scenario = localStorage.getItem('kurio:favorites-scenario')
  await delay(scenario === 'slow' ? 1800 : nftId && scenario === 'mutation-error' ? 1000 : 250)
  if (scenario === 'offline') return HttpResponse.error()
  try { return await withCartLock(() => {
    const { user } = requireSession(request)
    if (scenario === 'error' || (nftId && scenario === 'mutation-error')) return HttpResponse.json({ message: 'Não foi possível atualizar seus favoritos. Tente novamente.' }, { status: 503 })
    const key = `kurio:favorites:v1:${user.id}`
    const stored = localStorage.getItem(key)
    const record = stored ? recordSchema.parse(JSON.parse(stored)) : { version: 0, ids: [] as string[] }
    if (nftId) {
      if (!catalogFixtures.some(nft => nft.id === nftId)) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
      const ids = add ? [...new Set([...record.ids, nftId])] : record.ids.filter(id => id !== nftId)
      if (JSON.stringify(ids) !== JSON.stringify(record.ids)) { record.ids = ids; record.version++; localStorage.setItem(key, JSON.stringify(record)) }
    }
    return HttpResponse.json({ ...record, items: record.ids.map(id => catalogFixtures.find(nft => nft.id === id)).filter(nft => !!nft).map(resolveMarketplaceNft) })
  }) } catch (error) {
    return HttpResponse.json({ message: error instanceof AuthError ? error.message : 'Não foi possível acessar seus favoritos neste navegador.' }, { status: error instanceof AuthError ? error.status : 503 })
  }
}
export const favoritesHandlers = [http.get('*/api/favorites', ({ request }) => respond(request)), http.put('*/api/favorites/:id', ({ request, params }) => respond(request, String(params.id))), http.delete('*/api/favorites/:id', ({ request, params }) => respond(request, String(params.id), false))]
