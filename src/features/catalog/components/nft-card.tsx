import favoriteFilled from '@/shared/assets/figma/favorite-filled.svg'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { Link, useLocation } from '@tanstack/react-router'
import type { Nft } from '@/shared/contracts/catalog'
import { formatEth } from '@/shared/lib/eth'
import favorite from '@/shared/assets/figma/favorite.svg'

export function NftCard({ nft, returnTo }: { nft: Nft; returnTo?: string }) {
  const location = useLocation()
  const backTo = returnTo ?? (location.pathname === '/' ? `/${location.searchStr}#mercado` : '/#mercado')
  const selection = { quantity: 1, returnTo: backTo }
  return (
    <article aria-label={nft.name} className="nft-card" data-testid="nft-card">
      <div className={`nft-card-artwork ${nft.imageLayout === 'portrait' ? 'nft-card-portrait' : ''}`}>
        <Link to="/nfts/$nftId" params={{ nftId: nft.id }} search={selection} aria-label={`Ver detalhes de ${nft.name}`} className="nft-card-image-link"><img src={nft.image} alt={nft.imageAlt} width="250" height="250" loading="lazy" decoding="async" className="nft-card-image" /></Link>
        <FavoriteButton id={nft.id} name={nft.name} icon={favorite} filledIcon={favoriteFilled} className="card-favorite" />
      </div>
      <div className="nft-card-info"><h3><Link to="/nfts/$nftId" params={{ nftId: nft.id }} search={selection} className="hover:text-accent">{nft.name}</Link></h3><p className="nft-card-price"><span>{formatEth(nft.priceEth)}</span>{nft.previousPriceEth && <del className="hidden text-secondary lg:inline">{formatEth(nft.previousPriceEth)}</del>}</p></div>
    </article>
  )
}
