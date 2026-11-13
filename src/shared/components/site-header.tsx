import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { defaultCatalogSearch, type CatalogSearch } from '@/shared/contracts/catalog'
import { Button } from '@/shared/ui/button'
import cartIcon from '@/shared/assets/figma/cart.svg'
import searchIcon from '@/shared/assets/figma/search.svg'
import loginIcon from '@/shared/assets/figma/login.svg'
import underline from '@/shared/assets/figma/nav-underline.svg'
import marketUnderline from '@/shared/assets/figma/market-underline.svg'
import { cn } from '@/shared/lib/utils'
import divider from '@/shared/assets/figma/header-divider.svg'
import mobileSearch from '@/shared/assets/figma/mobile-search.svg'
import filterIcon from '@/shared/assets/figma/filter.svg'

const comingSoon = 'Disponível em uma próxima etapa'

interface SiteHeaderProps { marketOnPage?: boolean; accountControl?: ReactNode; cartControl?: ReactNode; searchControl?: ReactNode; filterControl?: ReactNode; onSearch?: () => void; active?: 'home' | 'market'; marketSearch?: CatalogSearch }

export function SiteHeader({ marketOnPage = true, accountControl, cartControl, searchControl, filterControl, onSearch, active = 'home', marketSearch = defaultCatalogSearch }: SiteHeaderProps) {
  return (
    <header className="page-container pt-10 lg:pt-6">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:p-3 focus:text-primary-foreground">Pular para o conteúdo</a>
      <div className="relative hidden min-h-[45px] items-start justify-between lg:flex" style={{ backgroundImage: active === 'home' ? `url("${divider}")` : undefined, backgroundPosition: 'bottom', backgroundRepeat: 'repeat-x' }}>
        <Link to="/" search={defaultCatalogSearch} aria-label="Kurio — início" className="flex h-[35px] w-40 items-center text-sm font-bold tracking-[1.4px]">KURIO</Link>
        <nav aria-label="Navegação principal" className="flex items-start gap-10 text-base leading-[21px]">
          <Link to="/" search={defaultCatalogSearch} aria-current={active === 'home' ? 'page' : undefined} className={cn('relative pb-6', active === 'home' && 'font-bold text-accent')}>Início{active === 'home' && <img src={underline} alt="" className="absolute bottom-0 left-0" />}</Link>
          {active === 'home' && marketOnPage ? <a href="#mercado">Mercado</a> : <Link to="/" search={marketSearch} hash="mercado" aria-current={active === 'market' ? 'location' : undefined} className={cn('relative pb-6', active === 'market' && 'font-bold text-accent')}>Mercado{active === 'market' && <img src={marketUnderline} alt="" className="absolute bottom-0 left-0" />}</Link>}
          <span aria-disabled="true" title="Criadores: fora do escopo deste desafio">Criadores</span>
          <span aria-disabled="true" title="Conteúdo educativo: fora do escopo deste desafio">Aprenda</span>
        </nav>
        <div className="flex items-center gap-7">
          <Button variant="ghost" size="icon" className="h-[35px] w-5" aria-label="Buscar NFTs" title="Buscar NFTs" disabled={!onSearch} onClick={onSearch}><img src={searchIcon} alt="" /></Button>
          {cartControl ?? <Button variant="ghost" size="icon" className="h-[35px] w-[31px]" aria-label="Carrinho de NFTs" title={comingSoon} disabled><img src={cartIcon} alt="" /></Button>}
          {accountControl ?? <Button className="h-[35px] w-[100px] px-2 text-base" title={comingSoon} disabled><img src={loginIcon} alt="" />Entrar</Button>}
        </div>
      </div>
      <div className="flex items-center gap-2 lg:hidden">
        {searchControl ?? <button type="button" disabled title={comingSoon} aria-label="Buscar coleções — em breve" className="flex h-[45px] min-w-0 flex-1 cursor-not-allowed items-center gap-2 rounded-[10px] bg-card px-3 text-left text-sm font-bold text-secondary"><img src={mobileSearch} alt="" /><span className="truncate">Explorar coleções</span></button>}
        {cartControl}
        {accountControl}
        {filterControl ?? <Button size="icon" disabled aria-label="Filtrar NFTs — em breve" title={comingSoon} className="size-[45px] rounded-[14px] bg-[linear-gradient(137deg,rgba(210,138,76,0.45)_25%,#d28a4c_100%)]"><img src={filterIcon} alt="" /></Button>}
      </div>
    </header>
  )
}
