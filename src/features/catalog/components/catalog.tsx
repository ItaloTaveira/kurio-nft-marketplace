import { useQuery } from '@tanstack/react-query'
import type { CatalogSearch as CatalogSearchState } from '@/shared/contracts/catalog'
import { catalogTabs, sortOptions } from '@/shared/contracts/catalog'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'
import { catalogQuery } from '../queries'
import { CatalogFilters } from './catalog-filters'
import { CatalogSkeleton } from './catalog-skeleton'
import { NftCard } from './nft-card'
import sortChevron from '@/shared/assets/figma/sort-chevron.svg'
import paginationChevron from '@/shared/assets/figma/pagination-chevron.svg'
import featured from '@/shared/assets/figma/catalog-nomad.webp'
import './catalog.css'

type CatalogProps = {
  search: CatalogSearchState
  onChange: (patch: Partial<CatalogSearchState>) => void
  onReset: () => void
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
}
export function Catalog({ search, onChange, onReset, filtersOpen, onFiltersOpenChange }: CatalogProps) {
  const query = useQuery(catalogQuery(search))
  const data = query.data
  const filterProps = { search, facets: data?.facets, onChange, onReset }
  return (
    <section id="mercado" aria-labelledby="market-title" tabIndex={-1} className="catalog-section">
      <h2 id="market-title" className="sr-only">Explore o mercado</h2>
      <aside aria-label="Filtros do catálogo" className="hidden min-w-0 lg:block">
        <CatalogFilters {...filterProps} />
        <div className="featured-nft mt-6" aria-label="NFT em destaque">
          <p className="px-5 text-2xl font-bold leading-8 text-accent">NFT EM DESTAQUE</p>
          <p className="mt-4 px-5 text-center text-[22px] font-bold leading-4">OFERTA LIMITADA</p>
          <img src={featured} alt="Sage Nomad em destaque" width="310" height="368" loading="lazy" className="mt-4 h-[368px] w-full rounded-[22px] object-cover" />
          <span aria-hidden="true" className="absolute top-[299px] left-4 size-[22px] rounded-[7px] border-2 border-[#46a358] opacity-20" />
          <span aria-hidden="true" className="featured-bubble top-[343px] left-[248px] size-[45px]" />
          <span aria-hidden="true" className="featured-bubble top-[105px] left-[38px] size-[15px]" />
        </div>
      </aside>
      <div className="min-w-0">
        <div className="catalog-toolbar">
          <div role="group" aria-label="Seleção de NFTs" className="catalog-tabs">
            {catalogTabs.map(tab => <button key={tab.id} type="button" aria-pressed={search.tab === tab.id} onClick={() => onChange({ tab: tab.id })} className={cn('catalog-tab', search.tab === tab.id && 'catalog-tab-active')}>{tab.label}</button>)}
          </div>
          <label className="catalog-sort"><span>Ordenar por:</span><select aria-label="Ordenar NFTs" value={search.sort} onChange={event => onChange({ sort: event.target.value as CatalogSearchState['sort'] })} style={{ backgroundImage: `url("${sortChevron}")` }}>{sortOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        </div>
        {(search.q || search.collections.length > 0 || search.networks.length > 0 || search.minPrice || search.maxPrice) && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><p>{search.q ? `Busca: “${search.q}”` : 'Filtros aplicados'}</p><button onClick={onReset} className="text-accent underline underline-offset-4">Limpar busca e filtros</button></div>}
        <p className="sr-only" role="status" aria-live="polite">{query.isFetching ? 'Atualizando catálogo' : data ? `${data.total} NFTs encontrados. Página ${data.page} de ${Math.max(1, data.totalPages)}.` : ''}</p>
        {query.isFetching && data && <p className="mb-4 text-xs text-muted-foreground">Atualizando catálogo…</p>}
        {query.isError && <div role="alert" className="mb-6 rounded-xl border border-border bg-card p-6"><h3 className="font-bold">Não foi possível carregar os NFTs</h3><p className="my-3 text-sm leading-6 text-muted-foreground">Verifique sua conexão e tente novamente.{data ? ' Os resultados anteriores estão sendo exibidos.' : ''}</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
        {query.isPending ? <CatalogSkeleton /> : data && (data.items.length ? <div className="catalog-grid" aria-label="Resultados do catálogo" aria-busy={query.isFetching}>{data.items.map(nft => <NftCard key={nft.id} nft={nft} />)}</div> : <div className="rounded-xl border border-border bg-card px-6 py-16 text-center"><h3 className="text-lg font-bold">Nenhum NFT encontrado</h3><p className="my-4 text-sm leading-6 text-muted-foreground">{data.total > 0 ? 'Esta página não tem resultados. Volte para a primeira página.' : 'Experimente outra busca ou ajuste os filtros.'}</p><Button onClick={data.total > 0 ? () => onChange({ page: 1 }) : onReset}>{data.total > 0 ? 'Primeira página' : 'Limpar filtros'}</Button></div>)}
        {data && data.totalPages > 1 && <nav aria-label="Paginação do catálogo" className="catalog-pagination">
          <Button variant="ghost" size="icon" aria-label="Página anterior" disabled={search.page <= 1} onClick={() => onChange({ page: Math.min(data.totalPages, search.page - 1) })} className="pagination-button"><img src={paginationChevron} alt="" className="rotate-90" /></Button>
          {Array.from({ length: data.totalPages }, (_, index) => index + 1).map(page => <Button key={page} variant="ghost" size="icon" aria-label={`Página ${page}`} aria-current={search.page === page ? 'page' : undefined} onClick={() => onChange({ page })} className={cn('pagination-button', page === search.page && 'bg-primary font-bold text-primary-foreground hover:bg-accent')}>{page}</Button>)}
          <Button variant="ghost" size="icon" aria-label="Próxima página" disabled={search.page >= data.totalPages} onClick={() => onChange({ page: search.page + 1 })} className="pagination-button"><img src={paginationChevron} alt="" className="-rotate-90" /></Button>
        </nav>}
      </div>
      <Dialog open={filtersOpen} onOpenChange={onFiltersOpenChange} title="Filtrar NFTs" description="Combine coleções, preços e redes para encontrar sua próxima coleção."><label className="mb-6 flex flex-col gap-3 text-sm lg:hidden">Ordenação<select aria-label="Ordenar NFTs" value={search.sort} onChange={event => onChange({ sort: event.target.value as CatalogSearchState['sort'] })} className="rounded-lg border border-border bg-card p-3">{sortOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><CatalogFilters {...filterProps} /><Button className="mt-6 w-full" onClick={() => onFiltersOpenChange(false)}>Ver resultados</Button></Dialog>
    </section>
  )
}
