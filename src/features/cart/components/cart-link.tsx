import { Link, useLocation, useSearch } from '@tanstack/react-router'
import { useCart } from '../queries'
import cartIcon from '@/shared/assets/figma/cart.svg'
import badge from '@/shared/assets/figma/cart-badge.svg'

export function CartLink() {
  const { data } = useCart()
  const location = useLocation()
  const params = useSearch({ strict: false })
  const returnTo = location.pathname === '/' ? `/${location.searchStr}#mercado` : params.returnTo ?? '/#mercado'
  const count = data?.totalQuantity ?? 0
  return <Link to="/carrinho" search={{ returnTo }} aria-label={`Carrinho de NFTs${data ? `, ${count} itens` : ''}`} className="relative flex h-[35px] w-[31px] shrink-0 items-center justify-center rounded-lg focus-visible:outline-offset-4"><img src={cartIcon} alt="" />{count > 0 && <span aria-hidden="true" className="absolute -top-0.5 -right-2 flex size-5 items-center justify-center text-[10px] font-medium text-primary-foreground" style={{ backgroundImage: `url("${badge}")`, backgroundSize: '100% 100%' }}>{count > 99 ? '99+' : count}</span>}</Link>
}
