import { useNavigate, useSearch } from '@tanstack/react-router'
import { catalogSearchSchema, defaultCatalogSearch, type CatalogSearch } from '@/shared/contracts/catalog'

export function useCatalogSearch() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const update = (patch: Partial<CatalogSearch>) => {
    void navigate({
      to: '/',
      search: previous => catalogSearchSchema.parse({ ...previous, ...patch, page: patch.page ?? 1 }),
      hash: 'mercado', resetScroll: false,
    })
  }
  const reset = () => update(defaultCatalogSearch)
  return { search, update, reset }
}
