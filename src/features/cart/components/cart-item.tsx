import { Link } from '@tanstack/react-router'
import type { CartItem as CartItemData } from '@/shared/contracts/cart'
import { QuantityPicker } from '@/shared/ui/quantity-picker'
import { formatEth } from '@/shared/lib/eth'
import deleteIcon from '@/shared/assets/figma/cart-delete.svg'

interface CartItemProps { item: CartItemData; pending: boolean; returnTo: string; onQuantity: (quantity: number) => void; onRemove: () => void }
export function CartItem({ item, pending, returnTo, onQuantity, onRemove }: CartItemProps) {
  const selection = { edition: item.editionId, quantity: item.quantity, returnTo }
  return (
    <li>
      <article id={`cart-item-${item.id}`} tabIndex={-1} aria-label={`${item.name}, edição ${item.editionLabel}`} data-testid="cart-item" className="cart-item">
        <Link to="/nfts/$nftId" params={{ nftId: item.nftId }} search={selection} className="cart-item-image"><img src={item.image} alt={item.imageAlt} width="100" height="100" /></Link>
        <div className="cart-item-info"><h2><Link to="/nfts/$nftId" params={{ nftId: item.nftId }} search={selection}>{item.name}</Link></h2><p className="hidden text-secondary lg:block">ID do token: {item.tokenId}</p><p className="cart-item-edition">Edição: {item.editionLabel}</p></div>
        <p className="cart-item-unit" aria-label="Preço unitário">{formatEth(item.unitPriceEth)}</p>
        <div className="cart-item-quantity"><QuantityPicker compact value={item.quantity} max={item.maxQuantity} disabled={pending || item.maxQuantity === 0} onChange={onQuantity} /></div>
        <p className="cart-item-total" aria-label="Total do item">{formatEth(item.lineTotalEth)}</p>
        <button type="button" disabled={pending} onClick={onRemove} aria-label={`Remover ${item.name}, edição ${item.editionLabel}`} className="cart-remove"><img src={deleteIcon} alt="" /></button>
      </article>
    </li>
  )
}
