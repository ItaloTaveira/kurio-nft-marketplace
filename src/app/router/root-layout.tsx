import { Suspense } from 'react'
import { useLocation, Outlet } from '@tanstack/react-router'
import { useDesktop } from '@/shared/hooks/use-desktop'
import { HomePage } from '@/routes/home-page'
import { SiteFooter } from '@/shared/components/site-footer'
import { MobileNavigation } from '@/shared/components/mobile-navigation'
import { SessionNotice } from '@/features/auth/components/session-notice'
import { RealtimeBridge } from './lazy-pages'

export function RootLayout() {
  const { pathname } = useLocation()
  const desktop = useDesktop()
  const auth = pathname === '/entrar' || pathname === '/cadastro'
  const showHome = pathname === '/' || (desktop && auth)
  return <><SessionNotice />{showHome && <div inert={auth || undefined} aria-hidden={auth || undefined}><HomePage /></div>}<Suspense fallback={<main className="page-container py-12" role="status" aria-label="Carregando página"><div className="h-96 rounded-xl bg-card skeleton-shimmer" /></main>}><Outlet /></Suspense><SiteFooter /><MobileNavigation /><Suspense fallback={null}><RealtimeBridge /></Suspense></>
}
