import { parseSearch } from '@/app/router/search-params'
import { useNavigate, useSearch, useLocation } from '@tanstack/react-router'
import { catalogSearchSchema, defaultCatalogSearch, type CatalogSearch } from '@/shared/contracts/catalog'

export function useCatalogSearch() {
  const raw = useSearch({ strict: false })
  const location = useLocation()
  const search = catalogSearchSchema.parse(location.pathname === '/' ? raw : parseSearch(new URL(typeof raw.returnTo === 'string' ? raw.returnTo : '/', window.location.origin).search))
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
