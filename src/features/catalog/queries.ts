import { queryOptions } from '@tanstack/react-query'
import type { CatalogSearch } from '@/shared/contracts/catalog'
import { getCatalog } from './api'

export function catalogQuery(search: CatalogSearch) {
  return queryOptions({
    queryKey: ['catalog', search] as const,
    queryFn: ({ signal }) => getCatalog(search, signal),
  })
}
