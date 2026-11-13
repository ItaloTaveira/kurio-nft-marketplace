import { http } from '@/shared/api/http'
import { catalogResponseSchema, type CatalogSearch } from '@/shared/contracts/catalog'

export async function getCatalog(search: CatalogSearch, signal: AbortSignal) {
  const { data } = await http.get<unknown>('/nfts', {
    signal,
    params: { ...search, collections: search.collections.join(','), networks: search.networks.join(',') },
  })
  return catalogResponseSchema.parse(data)
}
