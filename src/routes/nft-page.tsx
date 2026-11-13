import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { catalogSearchSchema, defaultCatalogSearch } from '@/shared/contracts/catalog'
import { nftSearchSchema, type NftSearch } from '@/shared/contracts/nft'
import { parseSearch } from '@/app/router/search-params'
import { MarketplaceHeader as SiteHeader } from '@/app/components/marketplace-header'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { CatalogSearch } from '@/features/catalog/components/catalog-search'
import { nftQuery } from '@/features/nft/queries'
import { NftDetail } from '@/features/nft/components/nft-detail'

export function NftPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const search = useSearch({ from: '/nfts/$nftId' })
  const navigate = useNavigate({ from: '/nfts/$nftId' })
  const [searchOpen, setSearchOpen] = useState(false)
  const query = useQuery(nftQuery(nftId))
  const returnUrl = new URL(search.returnTo ?? '/', window.location.origin)
  const catalogSearch = catalogSearchSchema.parse(parseSearch(returnUrl.search))
  const changeSelection = useCallback((patch: Partial<NftSearch>, replace = false) => {
    void navigate({
      to: '/nfts/$nftId', params: { nftId },
      search: previous => nftSearchSchema.parse({ ...previous, ...patch }),
      replace, resetScroll: false,
    })
  }, [navigate, nftId])
  const notFound = isAxiosError(query.error) && query.error.response?.status === 404
  return (
    <>
      <div className="hidden lg:block"><SiteHeader active="market" marketSearch={catalogSearch} onSearch={() => setSearchOpen(true)} /></div>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:p-3 focus:text-primary-foreground lg:hidden">Pular para o conteúdo</a>
      <main id="conteudo" tabIndex={-1} className="detail-page lg:mt-8">
        <nav aria-label="Caminho de navegação" className="mb-3 hidden gap-2 text-[15px] font-bold leading-4 lg:flex">
          <Link to="/" search={defaultCatalogSearch}>Início</Link><span aria-hidden="true">/</span><Link to="/" search={catalogSearch} hash="mercado">Mercado</Link>
        </nav>
        {query.isPending && <div role="status" aria-label="Carregando detalhes do NFT" className="detail-skeleton grid gap-8 p-6 lg:grid-cols-2 lg:p-0"><div aria-hidden="true" className="aspect-square rounded-3xl bg-card skeleton-shimmer" /><div aria-hidden="true" className="space-y-6"><div className="h-8 w-3/4 rounded bg-card skeleton-shimmer" /><div className="h-6 w-1/3 rounded bg-card skeleton-shimmer" /><div className="h-40 rounded bg-card skeleton-shimmer" /><div className="h-12 rounded bg-card skeleton-shimmer" /></div></div>}
        {query.isError && !query.data && <section className="mx-6 my-16 rounded-2xl border border-border bg-card p-8 lg:mx-0" aria-labelledby="detail-error-title"><h1 id="detail-error-title" className="text-2xl font-bold">{notFound ? 'NFT não encontrado' : 'Não foi possível carregar este NFT'}</h1><p role="alert" className="my-4 text-sm leading-6 text-muted-foreground">{notFound ? 'Esta obra não está disponível no catálogo. Explore outras coleções.' : 'Verifique sua conexão e tente novamente.'}</p><div className="flex flex-wrap gap-4">{!notFound && <Button onClick={() => void query.refetch()}>Tentar novamente</Button>}<Button variant="ghost" asChild><Link to="/" search={catalogSearch} hash="mercado">Voltar ao catálogo</Link></Button></div></section>}
        {query.isError && query.data && <div role="alert" className="mb-6 border border-border bg-card p-4 text-sm">Não foi possível atualizar este NFT. Os últimos dados disponíveis estão sendo exibidos. <button onClick={() => void query.refetch()} className="text-accent underline">Tentar novamente</button></div>}
        {query.isFetching && query.data && <p role="status" className="mb-3 text-xs text-muted-foreground">Atualizando dados da obra…</p>}
        {query.data && <NftDetail key={query.data.id} nft={query.data} search={search} catalogSearch={catalogSearch} onSelectionChange={changeSelection} />}
      </main>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen} title="Buscar NFTs" description="Pesquise pelo nome da arte ou da coleção."><CatalogSearch initialQuery={catalogSearch.q} autoFocus onSearch={q => { setSearchOpen(false); void navigate({ to: '/', search: { ...defaultCatalogSearch, q }, hash: 'mercado' }) }} /></Dialog>
    </>
  )
}
