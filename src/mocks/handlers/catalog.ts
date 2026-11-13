import { delay, http, HttpResponse } from 'msw'
import { resolveMarketplaceNft } from '@/mocks/database/marketplace'
import Decimal from 'decimal.js'
import { catalogSearchSchema, type CatalogResponse } from '@/shared/contracts/catalog'
import { catalogFixtures } from '@/mocks/fixtures/catalog'
import { getCatalogScenario } from '@/mocks/scenarios/catalog'

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const catalogHandlers = [
  http.get('*/api/nfts', async ({ request }) => {
    const url = new URL(request.url)
    const scenario = getCatalogScenario()
    const params = Object.fromEntries(url.searchParams)
    const search = catalogSearchSchema.parse({
      ...params,
      collections: (params.collections || '').split(',').filter(Boolean),
      networks: (params.networks || '').split(',').filter(Boolean),
    })
    await delay(scenario === 'slow' ? 2000 : scenario === 'out-of-order' ? (search.q.length <= 3 ? 1800 : 150) : 350)
    if (scenario === 'offline') return HttpResponse.error()
    if (scenario === 'error') return HttpResponse.json({ code: 'CATALOG_UNAVAILABLE', message: 'O catálogo está temporariamente indisponível.' }, { status: 503 })

    const facets: CatalogResponse['facets'] = { collections: {}, networks: {} }
    for (const nft of catalogFixtures) {
      facets.collections[nft.collection] = (facets.collections[nft.collection] ?? 0) + 1
      facets.networks[nft.network] = (facets.networks[nft.network] ?? 0) + 1
    }
    let items = scenario === 'empty' ? [] : catalogFixtures.map(resolveMarketplaceNft).filter(nft =>
      (!search.q || normalize(nft.name).includes(normalize(search.q))) &&
      (!search.collections.length || search.collections.includes(nft.collection)) &&
      (!search.networks.length || search.networks.includes(nft.network)) &&
      (!search.minPrice || new Decimal(nft.priceEth).gte(search.minPrice)) &&
      (!search.maxPrice || new Decimal(nft.priceEth).lte(search.maxPrice)) &&
      (search.tab !== 'new' || nft.isNew) &&
      (search.tab !== 'trending' || nft.popularity >= 70),
    )
    items = [...items].sort((a, b) => {
      if (search.sort === 'price-asc') return new Decimal(a.priceEth).comparedTo(b.priceEth) || a.id.localeCompare(b.id)
      if (search.sort === 'price-desc') return new Decimal(b.priceEth).comparedTo(a.priceEth) || a.id.localeCompare(b.id)
      if (search.tab === 'trending') return b.popularity - a.popularity || b.listedAt.localeCompare(a.listedAt)
      return b.listedAt.localeCompare(a.listedAt)
    })
    const pageSize = 9
    const response: CatalogResponse = {
      items: items.slice((search.page - 1) * pageSize, search.page * pageSize),
      total: items.length, page: search.page, pageSize,
      totalPages: Math.ceil(items.length / pageSize), facets,
    }
    return HttpResponse.json(response)
  }),
]
