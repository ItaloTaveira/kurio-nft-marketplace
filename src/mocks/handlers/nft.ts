import { delay, http, HttpResponse } from 'msw'
import { catalogFixtures } from '@/mocks/fixtures/catalog'
import { resolveMarketplaceDetail } from '@/mocks/database/marketplace'
import { getNftScenario } from '@/mocks/scenarios/nft'

export const nftHandlers = [
  http.get('*/api/nfts/:nftId', async ({ params }) => {
    const scenario = getNftScenario()
    await delay(scenario === 'slow' ? 2000 : 350)
    if (scenario === 'offline') return HttpResponse.error()
    if (scenario === 'error') return HttpResponse.json({ code: 'NFT_UNAVAILABLE', message: 'Não foi possível consultar o NFT.' }, { status: 503 })
    const nft = catalogFixtures.find(item => item.id === params.nftId)
    if (!nft) return HttpResponse.json({ code: 'NFT_NOT_FOUND', message: 'NFT não encontrado.' }, { status: 404 })
    const detail = resolveMarketplaceDetail(nft)
    return HttpResponse.json(detail)
  }),
]
