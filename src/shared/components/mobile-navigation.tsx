import { Link, useLocation } from '@tanstack/react-router'
import { defaultCatalogSearch } from '@/shared/contracts/catalog'
import user from '@/shared/assets/figma/account-imgUser.svg'
import cart from '@/shared/assets/figma/cart.svg'
import heart from '@/shared/assets/figma/favorite.svg'
import search from '@/shared/assets/figma/search.svg'
export function MobileNavigation() {
  const location = useLocation()
  if (['/entrar', '/cadastro'].includes(location.pathname)) return null
  return <nav aria-label="Navegação mobile" className="mobile-navigation"><Link to="/" search={defaultCatalogSearch} aria-current={location.pathname === '/' && !location.hash ? 'page' : undefined}><span aria-hidden="true" className="mobile-home-mark">K</span>Início</Link><Link to="/" search={defaultCatalogSearch} hash="mercado" aria-current={location.pathname === '/' && !!location.hash ? 'page' : undefined}><img src={search} alt="" />Mercado</Link><Link to="/favoritos" aria-current={location.pathname === '/favoritos' ? 'page' : undefined}><img src={heart} alt="" />Favoritos</Link><Link to="/carrinho" aria-current={location.pathname === '/carrinho' ? 'page' : undefined}><img src={cart} alt="" />Carrinho</Link><Link to="/perfil" aria-current={location.pathname === '/perfil' ? 'page' : undefined}><img src={user} alt="" />Conta</Link></nav>
}
