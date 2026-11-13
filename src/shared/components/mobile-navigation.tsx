import cart from '@/shared/assets/figma/mobile-nav-shop.svg'
import user from '@/shared/assets/figma/mobile-nav-user.svg'
import { Link, useLocation } from '@tanstack/react-router'
import { Home, Heart, ScanLine } from 'lucide-react'
import { defaultCatalogSearch } from '@/shared/contracts/catalog'
export function MobileNavigation() {
  const { pathname, hash } = useLocation()
  if (['/entrar', '/cadastro', '/carrinho', '/pagamento'].includes(pathname) || pathname.startsWith('/nfts/') || pathname.startsWith('/pedidos/')) return null
  return <nav aria-label="Navegação mobile" className="mobile-navigation">
    <Link to="/" search={defaultCatalogSearch} aria-label="Início" aria-current={pathname === '/' && !hash ? 'page' : undefined}><Home aria-hidden="true" fill="currentColor" /><span className="sr-only">Início</span></Link>
    <Link to="/favoritos" aria-label="Favoritos" aria-current={pathname === '/favoritos' ? 'page' : undefined}><Heart aria-hidden="true" fill="currentColor" /><span className="sr-only">Favoritos</span></Link>
    <Link to="/" search={defaultCatalogSearch} hash="mercado" className="mobile-market-action" aria-label="Mercado" aria-current={pathname === '/' && !!hash ? 'page' : undefined}><ScanLine aria-hidden="true" /><span className="sr-only">Mercado</span></Link>
    <Link to="/carrinho" aria-label="Carrinho"><img src={cart} alt="" /><span className="sr-only">Carrinho</span></Link>
    <Link to="/perfil" aria-label="Conta" aria-current={pathname === '/perfil' ? 'page' : undefined}><img src={user} alt="" /><span className="sr-only">Conta</span></Link>
  </nav>
}
