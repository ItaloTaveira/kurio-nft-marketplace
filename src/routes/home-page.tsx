import { useState } from 'react'
import { MarketplaceHeader as SiteHeader } from '@/app/components/marketplace-header'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { Catalog } from '@/features/catalog/components/catalog'
import { CatalogSearch } from '@/features/catalog/components/catalog-search'
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search'
import filterIcon from '@/shared/assets/figma/filter.svg'

export function HomePage() {
  const { search, update, reset } = useCatalogSearch()
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const onSearch = (q: string) => { update({ q }); setSearchOpen(false) }
  return (
    <>
      <SiteHeader
        onSearch={() => setSearchOpen(true)}
        searchControl={<CatalogSearch key={search.q} initialQuery={search.q} onSearch={onSearch} />}
        filterControl={<Button size="icon" aria-label="Filtrar NFTs" onClick={() => setFiltersOpen(true)} className="size-[45px] rounded-[14px] bg-[linear-gradient(137deg,rgba(210,138,76,0.45)_25%,#d28a4c_100%)]"><img src={filterIcon} alt="" /></Button>}
      />
      <main id="conteudo" tabIndex={-1} className="page-container mt-4 pb-16 lg:mt-8">
        <HomeHero />
        <Catalog search={search} onChange={update} onReset={reset} filtersOpen={filtersOpen} onFiltersOpenChange={setFiltersOpen} />
      </main>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen} title="Buscar NFTs" description="Pesquise pelo nome da arte ou da coleção."><CatalogSearch key={search.q} initialQuery={search.q} onSearch={onSearch} autoFocus /></Dialog>
    </>
  )
}
