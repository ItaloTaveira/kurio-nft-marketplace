import type { PropsWithChildren } from 'react'
import { Link } from '@tanstack/react-router'
import { MarketplaceHeader } from '@/app/components/marketplace-header'
import { Button } from '@/shared/ui/button'
import { defaultCatalogSearch } from '@/shared/contracts/catalog'
import '@/features/account/components/account.css'
import './checkout.css'
export function CheckoutLayout({ title, children }: PropsWithChildren<{ title: string }>) {
  return <><MarketplaceHeader marketOnPage={false} active="market" searchControl={<Button asChild variant="ghost"><Link to="/" search={defaultCatalogSearch} hash="mercado">← Mercado</Link></Button>} filterControl={<></>} /><main id="conteudo" tabIndex={-1} className="page-container checkout-page"><nav aria-label="Caminho de navegação" className="checkout-breadcrumb"><Link to="/carrinho">Carrinho</Link><span aria-hidden="true">/</span><span>{title}</span></nav><h1>{title}</h1>{children}</main></>
}
export function CheckoutLoading({ label }: { label: string }) { return <div role="status" aria-label={label} className="checkout-grid"><div className="h-[420px] rounded-xl bg-card skeleton-shimmer" /><div className="h-80 rounded-xl bg-card skeleton-shimmer" /></div> }
