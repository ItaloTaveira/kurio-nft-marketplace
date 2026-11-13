import { FavoriteButton } from '@/features/favorites/favorite-button'
import { getSessionToken } from '@/shared/api/session-token'
import { useEffect, useRef, useState } from 'react'
import Decimal from 'decimal.js'
import { Link, useNavigate } from '@tanstack/react-router'
import type { CatalogSearch } from '@/shared/contracts/catalog'
import type { NftDetail as NftDetailData, NftSearch } from '@/shared/contracts/nft'
import { useCartCommands } from '@/features/cart/queries'
import { apiErrorMessage } from '@/shared/api/errors'
import { formatEth } from '@/shared/lib/eth'
import { Button } from '@/shared/ui/button'
import { NftCard } from '@/features/catalog/components/nft-card'
import { NftGallery } from './nft-gallery'
import { EditionPicker } from './edition-picker'
import { QuantityPicker } from '@/shared/ui/quantity-picker'
import { NftInformation } from './nft-information'
import backIcon from '@/shared/assets/figma/detail-back.svg'
import heartIcon from '@/shared/assets/figma/detail-heart.svg'
import mobileHeart from '@/shared/assets/figma/detail-mobile-heart.svg'
import shopIcon from '@/shared/assets/figma/detail-shop.svg'
import star from '@/shared/assets/figma/detail-star.svg'
import mutedStar from '@/shared/assets/figma/detail-star-muted.svg'
import linkedin from '@/shared/assets/figma/detail-linkedin.svg'
import message from '@/shared/assets/figma/detail-message.svg'
import twitter from '@/shared/assets/figma/detail-twitter.svg'
import '@/features/catalog/components/catalog.css'
import './nft-detail.css'

interface NftDetailProps {
  nft: NftDetailData
  search: NftSearch
  catalogSearch: CatalogSearch
  onSelectionChange: (patch: Partial<NftSearch>, replace?: boolean) => void
}
export function NftDetail({ nft, search, catalogSearch, onSelectionChange }: NftDetailProps) {
  const cartCommands = useCartCommands()
  const navigate = useNavigate()
  const inFlight = useRef(false)
  const attempt = useRef<{ signature: string; key: string } | null>(null)
  const [cartError, setCartError] = useState('')
  const selectedId = search.edition ?? nft.defaultEditionId
  const edition = nft.editions.find(item => item.id === selectedId)
  const limit = edition ? Math.min(edition.remaining, edition.maxPerOrder) : 0
  const quantity = Math.min(search.quantity, Math.max(1, limit))
  const unitPrice = edition?.priceEth ?? nft.priceEth
  const subtotal = new Decimal(unitPrice).mul(quantity).toFixed()
  const allSoldOut = nft.editions.every(item => item.remaining === 0)
  const stageHint = 'Adicione ao carrinho para continuar. Seus favoritos ficam salvos na conta.'
  const addToCart = async () => {
    const actor = getSessionToken()
    if (!edition || !limit || inFlight.current) return
    inFlight.current = true
    setCartError('')
    const item = { nftId: nft.id, editionId: edition.id, quantity, expectedUnitPriceEth: edition.priceEth }
    const signature = JSON.stringify(item)
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() }
    try {
      await cartCommands.mutateAsync({ type: 'add', item, operationId: attempt.current!.key })
      if (getSessionToken() !== actor) return
      attempt.current = null
      await navigate({ to: '/carrinho', search: { returnTo: search.returnTo ?? '/#mercado' } })
    } catch (error) { setCartError(apiErrorMessage(error)) } finally { inFlight.current = false }
  }
  const title = `${nft.name} — Kurio`
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => { document.title = previous }
  }, [title])
  useEffect(() => {
    if (limit > 0 && search.quantity > limit) onSelectionChange({ quantity: limit }, true)
  }, [limit, search.quantity, onSelectionChange])

  const shareUrl = encodeURIComponent(window.location.href)
  return (
    <>
      <div className="detail-mobile-navigation">
        <Link to="/" search={catalogSearch} hash="mercado" aria-label="Voltar ao catálogo" className="detail-round-action"><img src={backIcon} alt="" className="rotate-90" /></Link>
        <FavoriteButton id={nft.id} name={nft.name} icon={mobileHeart} className="detail-round-action" />
      </div>
      <div className="detail-product">
        <NftGallery nft={nft} />
        <div className="detail-sheet">
          <div className="detail-heading">
            <h1>{nft.name}</h1>
            <output aria-label="Preço unitário" className="detail-unit-price">{formatEth(unitPrice)}</output>
            <div className="detail-rating" aria-label={`${nft.rating.value} de 5, ${nft.rating.count} avaliações`}>
              <div className="hidden gap-1 lg:flex" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <span key={index} className="flex size-[15px] items-center justify-center"><img src={index < 4 ? star : mutedStar} alt="" /></span>)}</div>
              <img src={star} alt="" className="lg:hidden" />
              <span className="lg:hidden">{nft.rating.value}</span>
              <span className="text-muted-foreground lg:hidden">({nft.rating.count})</span>
              <span className="hidden lg:inline">{nft.rating.count} avaliações de colecionadores</span>
            </div>
          </div>
          <div className="detail-summary"><h2 className="mb-3 hidden text-[15px] font-bold leading-4 lg:block">Sobre este NFT:</h2><p className="hidden lg:block">{nft.description}</p><p className="lg:hidden">{nft.mobileDescription}</p></div>
          <EditionPicker editions={nft.editions} selectedId={edition?.id} onSelect={id => onSelectionChange({ edition: id, quantity: 1 })} />
          {!edition && <p role="alert" className="text-sm text-accent">A edição selecionada não existe. Escolha uma edição disponível.</p>}
          {(allSoldOut || edition?.remaining === 0) && <p role="status" className="text-sm text-accent">{allSoldOut ? 'Este NFT está esgotado.' : 'Esta edição está esgotada. Escolha outra edição.'}</p>}
          <div className="detail-token-info">
            <dl><div><dt>ID do token: </dt><dd>{nft.tokenId}</dd></div><div><dt>Coleção: </dt><dd>{nft.collectionName}</dd></div><div><dt>Atributos: </dt><dd>{nft.attributes.join(', ')}</dd></div></dl>
            <div className="detail-sharing"><span className="font-bold text-foreground">Compartilhar este NFT:</span><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noreferrer" aria-label="Compartilhar no LinkedIn"><img src={linkedin} alt="" /></a><a href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${shareUrl}`} aria-label="Compartilhar por e-mail"><img src={message} alt="" /></a><a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(nft.name)}&url=${shareUrl}`} target="_blank" rel="noreferrer" aria-label="Compartilhar no X"><img src={twitter} alt="" /></a></div>
          </div>
          <div className="detail-purchase">
            <div className="detail-purchase-selection">
              <QuantityPicker key={edition?.id ?? 'invalid'} value={quantity} max={limit} disabled={limit === 0} onChange={next => onSelectionChange({ quantity: next }, true)} />
              <output aria-label="Subtotal da seleção" aria-live="polite" className={`detail-subtotal ${quantity === 1 ? 'detail-subtotal-unit' : ''}`}>{formatEth(subtotal)}</output>
            </div>
            <div className="detail-purchase-actions">
              <Button disabled={limit === 0 || cartCommands.isPending} onClick={() => void addToCart()} aria-describedby="detail-purchase-note" className="detail-buy">{cartCommands.isPending ? 'Adicionando…' : <><span className="lg:hidden">Comprar NFT</span><span className="hidden lg:inline">COMPRAR</span></>}</Button>
              <FavoriteButton id={nft.id} name={nft.name} icon={heartIcon} className="detail-favorite" text />
              <Button asChild variant="ghost" className="detail-cart"><Link to="/carrinho" search={{ returnTo: search.returnTo ?? '/#mercado' }} aria-label="Ver carrinho"><img src={shopIcon} alt="" /></Link></Button>
            </div>
            {cartError && <p role="alert" className="text-xs leading-5 text-accent lg:col-span-2">{cartError}</p>}
            <p id="detail-purchase-note" className="detail-stage-hint">{stageHint}</p>
          </div>
        </div>
      </div>
      <NftInformation nft={nft} />
      <section aria-labelledby="related-title" className="detail-related">
        <h2 id="related-title">Mais desta coleção</h2>
        <div className="detail-related-grid">{nft.related.map(item => <NftCard key={item.id} nft={item} returnTo={search.returnTo ?? '/#mercado'} />)}</div>
      </section>
    </>
  )
}
