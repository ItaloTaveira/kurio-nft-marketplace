import { SiteFooter } from '@/shared/components/site-footer'
import { RealtimeBridge, FavoritesPage, CheckoutPage, OrderPage, ProfilePage, WalletsPage, AuthPage, NftPage, CartPage } from './lazy-pages'
import { Suspense } from 'react'
import { MobileNavigation } from '@/shared/components/mobile-navigation'
import { PrivateAccount } from '@/features/account/components/private-account'
import { getSessionToken } from '@/shared/api/session-token'
import { SessionNotice } from '@/features/auth/components/session-notice'
import { authSearchSchema } from '@/shared/contracts/auth'
import { createRootRoute, createRoute, createRouter, redirect, Link, Outlet, stripSearchParams } from '@tanstack/react-router'
import { HomePage } from '@/routes/home-page'
import { cartSearchSchema, type CartSearch } from '@/shared/contracts/cart'
import { nftSearchSchema, defaultNftSearch, type NftSearch } from '@/shared/contracts/nft'
import { Button } from '@/shared/ui/button'
import { catalogSearchSchema, defaultCatalogSearch, type CatalogSearch } from '@/shared/contracts/catalog'
import { parseSearch, stringifySearch } from './search-params'

const rootRoute = createRootRoute({
  component: () => <><SessionNotice /><Suspense fallback={<main className="page-container py-12" role="status" aria-label="Carregando página"><div className="h-96 rounded-xl bg-card skeleton-shimmer" /></main>}><Outlet /></Suspense><SiteFooter /><MobileNavigation /><Suspense fallback={null}><RealtimeBridge /></Suspense></>,
  notFoundComponent: () => (
    <main className="page-container flex min-h-dvh flex-col items-start justify-center gap-6">
      <p className="text-sm text-accent">404</p>
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <Button asChild><Link to="/" search={defaultCatalogSearch}>Voltar ao início</Link></Button>
    </main>
  ),
})
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', validateSearch: (raw: Record<string, unknown>): CatalogSearch => catalogSearchSchema.parse(raw), search: { middlewares: [stripSearchParams<CatalogSearch>(defaultCatalogSearch)] }, component: HomePage })
const nftRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/nfts/$nftId',
  validateSearch: (raw: Record<string, unknown>): NftSearch => nftSearchSchema.parse(raw),
  search: { middlewares: [stripSearchParams<NftSearch>(defaultNftSearch)] },
  component: NftPage,
})
const cartRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/carrinho',
  validateSearch: (raw: Record<string, unknown>): CartSearch => cartSearchSchema.parse(raw),
  component: CartPage,
})
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/entrar', validateSearch: raw => authSearchSchema.parse(raw), component: () => <AuthPage mode="login" /> })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cadastro', validateSearch: raw => authSearchSchema.parse(raw), component: () => <AuthPage mode="register" /> })
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/perfil', beforeLoad: ({ location }) => { if (!getSessionToken()) throw redirect({ to: '/entrar', search: { returnTo: location.href } }) }, component: () => <PrivateAccount><ProfilePage /></PrivateAccount> })
const walletsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/carteiras', beforeLoad: ({ location }) => { if (!getSessionToken()) throw redirect({ to: '/entrar', search: { returnTo: location.href } }) }, component: () => <PrivateAccount><WalletsPage /></PrivateAccount> })
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pagamento', beforeLoad: ({ location }) => { if (!getSessionToken()) throw redirect({ to: '/entrar', search: { returnTo: location.href } }) }, component: () => <PrivateAccount><CheckoutPage /></PrivateAccount> })
const orderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pedidos/$orderId', beforeLoad: ({ location }) => { if (!getSessionToken()) throw redirect({ to: '/entrar', search: { returnTo: location.href } }) }, component: () => <PrivateAccount><OrderPage /></PrivateAccount> })
const favoritesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/favoritos', beforeLoad: ({ location }) => { if (!getSessionToken()) throw redirect({ to: '/entrar', search: { returnTo: location.href } }) }, component: () => <PrivateAccount><FavoritesPage /></PrivateAccount> })
export const router = createRouter({ routeTree: rootRoute.addChildren([homeRoute, nftRoute, cartRoute, loginRoute, registerRoute, profileRoute, walletsRoute, checkoutRoute, orderRoute, favoritesRoute]), parseSearch, stringifySearch })
declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
