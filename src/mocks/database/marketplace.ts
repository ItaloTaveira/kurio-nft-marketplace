import { marketplaceOverride } from './marketplace-events'
import { inventoryUsed } from './commerce-store'
import Decimal from 'decimal.js'
import type { Nft } from '@/shared/contracts/catalog'
import { makeNftDetail } from '@/mocks/fixtures/nft'
import { getNftScenario } from '@/mocks/scenarios/nft'
import { getCartScenario } from '@/mocks/scenarios/cart'

export function resolveMarketplaceNft(nft: Nft): Nft {
  const override = marketplaceOverride(nft.id)
  if (override?.priceEth) return { ...nft, priceEth: override.priceEth }
  if (getCartScenario() === 'price-changed' && nft.id === 'emerald-ape-042') return { ...nft, priceEth: new Decimal(nft.priceEth).mul('1.1').toFixed(2) }
  return nft
}
export function resolveMarketplaceDetail(nft: Nft, excludedOrderId?: string) {
  const detail = makeNftDetail(resolveMarketplaceNft(nft))
  detail.related = detail.related.map(resolveMarketplaceNft)
  const scenario = getNftScenario()
  const cartScenario = getCartScenario()
  const first = nft.id === 'emerald-ape-042'
  if (scenario === 'sold-out' || (first && cartScenario === 'sold-out')) detail.editions = detail.editions.map(edition => ({ ...edition, remaining: 0 }))
  if (scenario === 'stock-reduced' || (first && cartScenario === 'stock-reduced')) detail.editions = detail.editions.map(edition => edition.id === detail.defaultEditionId ? { ...edition, remaining: 1 } : edition)
  const override = marketplaceOverride(nft.id)
  if (override?.remaining !== undefined) detail.editions = detail.editions.map(edition => edition.id === detail.defaultEditionId ? { ...edition, remaining: override.remaining! } : edition)
  detail.editions = detail.editions.map(edition => ({ ...edition, remaining: Math.max(0, edition.remaining - inventoryUsed(nft.id, edition.id, excludedOrderId)) }))
  return detail
}
