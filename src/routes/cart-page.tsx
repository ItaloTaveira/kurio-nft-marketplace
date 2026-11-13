import { getSessionToken } from '@/shared/api/session-token'
import { AccountControl } from '@/features/auth/components/account-control'
import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { MarketplaceHeader } from '@/app/components/marketplace-header'
import { parseSearch } from '@/app/router/search-params'
import { catalogSearchSchema, defaultCatalogSearch } from '@/shared/contracts/catalog'
import { apiErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { CatalogSearch } from '@/features/catalog/components/catalog-search'
import { NftCard } from '@/features/catalog/components/nft-card'
import { CartItem } from '@/features/cart/components/cart-item'
import { CartSummary } from '@/features/cart/components/cart-summary'
import { useCart, useCartCommands } from '@/features/cart/queries'
import type { CartAction } from '@/features/cart/api'
import back from '@/shared/assets/figma/detail-back.svg'
import backBackground from '@/shared/assets/figma/cart-back-background.svg'
import '@/features/catalog/components/catalog.css'
import '@/features/cart/components/cart.css'

export function CartPage() {
  const search = useSearch({ from: '/carrinho' })
  const navigate = useNavigate({ from: '/carrinho' })
  const query = useCart()
  const commands = useCartCommands()
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const returnTo = search.returnTo ?? '/#mercado'
  const catalogSearch = catalogSearchSchema.parse(parseSearch(new URL(returnTo, location.origin).search))
  const data = query.data
  const pending = query.pending || query.isFetching
  const act = async (action: CartAction, message: string) => {
    const actor = getSessionToken()
    setError(''); setFeedback('')
    try {
      await commands.mutateAsync(action)
      if (getSessionToken() !== actor) return
      setFeedback(message)
      if (action.type === 'remove') document.getElementById('cart-heading')?.focus()
    } catch (failure) {
      if (getSessionToken() !== actor) return
      setError(apiErrorMessage(failure))
      if (action.type === 'remove') requestAnimationFrame(() => document.getElementById(`cart-item-${action.itemId}`)?.focus())
    }
  }
  return (
    <>
      <div className="hidden lg:block"><MarketplaceHeader active="market" marketSearch={catalogSearch} onSearch={() => setSearchOpen(true)} /></div>
      <main id="conteudo" tabIndex={-1} className="cart-page">
        <div className="cart-mobile-heading"><Link to="/" search={catalogSearch} hash="mercado" aria-label="Voltar ao catálogo" style={{ backgroundImage: `url("${backBackground}")` }}><img src={back} alt="" className="rotate-90" /></Link><h1 id="cart-heading" tabIndex={-1}>Carrinho de NFTs</h1></div>
        <nav aria-label="Caminho de navegação" className="mb-3 hidden gap-2 text-[15px] font-bold leading-4 lg:flex"><Link to="/" search={defaultCatalogSearch}>Início</Link><span aria-hidden="true">/</span><Link to="/" search={catalogSearch} hash="mercado">Mercado</Link><span aria-hidden="true">/</span><span>Carrinho</span></nav>
        <div className="cart-account-mobile"><AccountControl /></div>
        <p role="status" aria-live="polite" className="cart-feedback">{feedback}</p>
        {error && <p role="alert" className="cart-notice">{error}</p>}
        {query.isError && <div role="alert" className="cart-notice"><p>Não foi possível consultar o carrinho. Seus itens não foram descartados.</p><Button onClick={() => void query.refetch()} className="mt-3">Tentar novamente</Button></div>}
        {query.isPending && <div role="status" aria-label="Carregando carrinho" className="cart-body"><div className="space-y-5">{[0, 1, 2].map(key => <div key={key} aria-hidden="true" className="h-[100px] rounded-xl bg-card skeleton-shimmer lg:h-[70px]" />)}</div><div aria-hidden="true" className="h-80 rounded-xl bg-card skeleton-shimmer" /></div>}
        {data && (data.items.length === 0 && !query.pending ? <section className="cart-empty"><h2 className="text-xl font-bold">Seu carrinho está vazio</h2><p className="my-4 text-sm leading-6 text-muted-foreground">Explore as coleções e escolha sua próxima arte digital.</p><Button asChild><Link to="/" search={catalogSearch} hash="mercado">Explorar NFTs</Link></Button></section> : <>
          {data.quote.issues.length > 0 && <div role="alert" className="cart-notice"><h2 className="mb-2 font-bold">Revise seu carrinho</h2><ul className="space-y-2 text-sm leading-6">{data.quote.issues.map((issue, index) => <li key={`${issue.code}-${issue.itemId ?? index}`}>{issue.message}</li>)}</ul>{data.quote.issues.some(issue => issue.code === 'PRICE_CHANGED') && <Button disabled={pending || data.quote.issues.some(issue => issue.code === 'STOCK_CHANGED')} onClick={() => void act({ type: 'accept-prices', version: data.version }, 'Novos preços aceitos.')} className="mt-4">Aceitar novos preços</Button>}</div>}
          <div className="cart-body">
            <section aria-label="Itens do carrinho" aria-busy={pending}>
              <div aria-hidden="true" className="cart-table-heading"><span>NFTs</span><span>Preço</span><span>Edições</span><span>Total</span><span /></div>
              <ul className="cart-items">{data.items.map(item => <CartItem key={item.id} item={item} pending={pending} returnTo={returnTo} onQuantity={quantity => void act({ type: 'quantity', itemId: item.id, quantity, version: data.version }, 'Quantidade atualizada.')} onRemove={() => void act({ type: 'remove', itemId: item.id, version: data.version }, 'Item removido do carrinho.')} />)}</ul>
              {data.items.length === 0 && query.pending && <p role="status" className="p-6 text-sm text-muted-foreground">Atualizando itens…</p>}
            </section>
            <CartSummary cart={data} pending={pending} catalogSearch={catalogSearch} onAction={act} />
          </div>
          <section aria-labelledby="cart-related-title" className="cart-related"><h2 id="cart-related-title">Colecionadores também viram</h2><div className="cart-related-grid">{data.recommendations.map(nft => <NftCard key={nft.id} nft={nft} returnTo={returnTo} />)}</div></section>
        </>)}
      </main>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen} title="Buscar NFTs" description="Pesquise pelo nome da arte ou da coleção."><CatalogSearch initialQuery={catalogSearch.q} autoFocus onSearch={q => { setSearchOpen(false); void navigate({ to: '/', search: { ...defaultCatalogSearch, q }, hash: 'mercado' }) }} /></Dialog>
    </>
  )
}
