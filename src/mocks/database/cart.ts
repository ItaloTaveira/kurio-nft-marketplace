import { z } from 'zod'
import Decimal from 'decimal.js'
import type { CartResponse, AddCartItem } from '@/shared/contracts/cart'
import { ethSchema } from '@/shared/contracts/catalog'
import { catalogFixtures } from '@/mocks/fixtures/catalog'
import { getCartScenario } from '@/mocks/scenarios/cart'
import { resolveMarketplaceDetail, resolveMarketplaceNft } from './marketplace'

export const guestCartStorageKey = 'kurio:guest-cart:v1'
const referenceSchema = z.object({ nftId: z.string(), editionId: z.string(), quantity: z.number().int().min(1).max(10000), acceptedPriceEth: ethSchema })
const recordSchema = z.object({ version: z.number().int().nonnegative(), items: z.array(referenceSchema).max(50), coupon: z.enum(['KURIO10', 'BEMVINDO5']).nullable(), settledOrders: z.array(z.string()).default([]), operations: z.array(z.object({ key: z.string(), signature: z.string() })).max(100) })
type CartRecord = z.infer<typeof recordSchema> & { storageKey?: string }
export class CartError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code }
}
// Web Locks serializa read-modify-write entre abas. A fila é o fallback por contexto.
let queue: Promise<unknown> = Promise.resolve()
export async function withCartLock<T>(work: () => T): Promise<T> {
  if (navigator.locks) return navigator.locks.request('kurio:guest-cart', work)
  const result = queue.then(work, work)
  queue = result.catch(() => undefined)
  return result
}
const itemId = (nftId: string, editionId: string) => `${nftId}:${editionId}`
function detailFor(nftId: string) {
  const nft = catalogFixtures.find(item => item.id === nftId)
  if (!nft) throw new CartError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
  return resolveMarketplaceDetail(nft)
}
function emptyCart(): CartRecord { return { version: 0, items: [], coupon: null, settledOrders: [], operations: [] } }
export function readCart(owner = 'guest'): CartRecord {
  const storageKey = owner === 'guest' ? guestCartStorageKey : `kurio:user-cart:v1:${owner}`
  const stored = localStorage.getItem(storageKey)
  if (stored === null) {
    const record: CartRecord = { ...emptyCart(), storageKey }
    if (owner === 'guest' && getCartScenario() === 'seeded') {
      record.items = ['emerald-ape-042', 'violet-nomad-314', 'ivory-baron-088', 'golden-beat-207'].map((nftId, index) => ({ nftId, editionId: 'limited-50', quantity: index > 1 ? 2 : 1, acceptedPriceEth: detailFor(nftId).priceEth }))
    }
    saveCart(record)
    return record
  }
  try {
    const parsed = recordSchema.safeParse(JSON.parse(stored))
    if (parsed.success && parsed.data.items.every(item => {
      const nft = catalogFixtures.find(nft => nft.id === item.nftId)
      return nft && resolveMarketplaceDetail(nft).editions.some(edition => edition.id === item.editionId)
    })) return { ...parsed.data, storageKey }
  } catch { /* Registro corrompido não é usado como dado de negócio. */ }
  const record: CartRecord = { ...emptyCart(), storageKey }
  saveCart(record)
  return record
}
function saveCart(record: CartRecord) { localStorage.setItem(record.storageKey ?? guestCartStorageKey, JSON.stringify(recordSchema.parse(record))) }
export function assertVersion(record: CartRecord, header: string | null) {
  if (!header || !/^"\d+"$/.test(header)) throw new CartError(428, 'VERSION_REQUIRED', 'Recarregue o carrinho antes de alterar os itens.')
  if (Number(header.slice(1, -1)) !== record.version) throw new CartError(409, 'CART_CONFLICT', 'O carrinho foi alterado em outra operação. Confira os itens e tente novamente.')
}
function hashQuote(value: string) {
  let hash = 2166136261
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  return (hash >>> 0).toString(16)
}
export function cartResponse(record: CartRecord): CartResponse {
  const issues: CartResponse['quote']['issues'] = []
  const items = record.items.map(reference => {
    const detail = detailFor(reference.nftId)
    const edition = detail.editions.find(edition => edition.id === reference.editionId)!
    const id = itemId(reference.nftId, reference.editionId)
    const maxQuantity = Math.min(edition.remaining, edition.maxPerOrder)
    if (reference.quantity > maxQuantity) issues.push({ code: 'STOCK_CHANGED', itemId: id, message: maxQuantity ? `${detail.name}: apenas ${maxQuantity} unidades disponíveis para este pedido.` : `${detail.name}: edição esgotada. Remova o item para continuar.` })
    if (!new Decimal(edition.priceEth).eq(reference.acceptedPriceEth)) issues.push({ code: 'PRICE_CHANGED', itemId: id, message: `${detail.name}: preço alterado de ${reference.acceptedPriceEth} para ${edition.priceEth} ETH.` })
    return { network: detail.network, id, nftId: detail.id, editionId: edition.id, name: detail.name, image: detail.image, imageAlt: detail.imageAlt, tokenId: detail.tokenId, editionLabel: edition.label, quantity: reference.quantity, maxQuantity, unitPriceEth: edition.priceEth, acceptedUnitPriceEth: reference.acceptedPriceEth, lineTotalEth: new Decimal(edition.priceEth).mul(reference.quantity).toFixed() }
  })
  const subtotal = items.reduce((total, item) => total.add(item.lineTotalEth), new Decimal(0))
  const expired = !!record.coupon && getCartScenario() === 'coupon-expired'
  const percent = record.coupon === 'KURIO10' ? 10 : record.coupon === 'BEMVINDO5' ? 5 : 0
  const discount = expired ? new Decimal(0) : subtotal.mul(percent).div(100)
  const fee = items.length ? new Decimal('0.016') : new Decimal(0)
  if (expired) issues.push({ code: 'COUPON_EXPIRED', message: 'O cupom expirou. Remova ou substitua o código para continuar.' })
  const quote = {
    id: `quote-${record.version}-${hashQuote(JSON.stringify({ items, discount: discount.toFixed(), expired }))}`,
    currency: 'ETH' as const, subtotalEth: subtotal.toFixed(), discountEth: discount.toFixed(), networkFeeEth: fee.toFixed(), totalEth: subtotal.minus(discount).add(fee).toFixed(),
    coupon: record.coupon ? { code: record.coupon, valid: !expired, percentOff: percent, error: expired ? 'Cupom expirado.' : undefined } : null,
    issues, requiresReview: issues.length > 0, canCheckout: items.length > 0 && issues.length === 0,
  }
  const preferred = ['cosmic-bloom-118', 'violet-nomad-314', 'ivory-baron-088', 'golden-beat-207', 'golden-signal-160']
  const recommendations = preferred.map(id => catalogFixtures.find(item => item.id === id)!).map(resolveMarketplaceNft)
  return { version: record.version, items, itemCount: items.length, totalQuantity: items.reduce((total, item) => total + item.quantity, 0), quote, recommendations }
}
function commit(record: CartRecord) { record.version += 1; saveCart(record); return cartResponse(record) }
function assertQuantity(nftId: string, editionId: string, quantity: number) {
  const edition = detailFor(nftId).editions.find(edition => edition.id === editionId)
  if (!edition) throw new CartError(404, 'EDITION_NOT_FOUND', 'A edição selecionada não existe.')
  const max = Math.min(edition.remaining, edition.maxPerOrder)
  if (quantity > max) throw new CartError(409, 'STOCK_CONFLICT', max ? `O limite para esta edição é de ${max} unidades no carrinho.` : 'Esta edição está esgotada.')
  return edition
}
export function addItem(record: CartRecord, input: AddCartItem, key: string) {
  if (!key || key.length > 100) throw new CartError(400, 'IDEMPOTENCY_REQUIRED', 'A tentativa precisa de uma identificação válida.')
  const signature = JSON.stringify(input)
  const existingOperation = record.operations.find(operation => operation.key === key)
  if (existingOperation) {
    if (existingOperation.signature !== signature) throw new CartError(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa já foi usada para outro conteúdo.')
    return cartResponse(record)
  }
  const current = record.items.find(item => item.nftId === input.nftId && item.editionId === input.editionId)
  const edition = assertQuantity(input.nftId, input.editionId, (current?.quantity ?? 0) + input.quantity)
  if (!new Decimal(input.expectedUnitPriceEth).eq(edition.priceEth)) throw new CartError(409, 'PRICE_CONFLICT', 'O preço desta edição mudou. Confira o novo valor antes de adicionar.')
  if (current) current.quantity += input.quantity
  else {
    if (record.items.length >= 50) throw new CartError(409, 'CART_LIMIT', 'O carrinho aceita até 50 edições diferentes.')
    record.items.push({ nftId: input.nftId, editionId: input.editionId, quantity: input.quantity, acceptedPriceEth: edition.priceEth })
  }
  record.operations = [...record.operations.slice(-99), { key, signature }]
  return commit(record)
}
export function updateQuantity(record: CartRecord, id: string, quantity: number) {
  const item = record.items.find(item => itemId(item.nftId, item.editionId) === id)
  if (!item) throw new CartError(404, 'CART_ITEM_NOT_FOUND', 'Este item não está mais no carrinho.')
  assertQuantity(item.nftId, item.editionId, quantity)
  item.quantity = quantity
  return commit(record)
}
export function removeItem(record: CartRecord, id: string) {
  const index = record.items.findIndex(item => itemId(item.nftId, item.editionId) === id)
  if (index < 0) throw new CartError(404, 'CART_ITEM_NOT_FOUND', 'Este item não está mais no carrinho.')
  record.items.splice(index, 1)
  if (!record.items.length) record.coupon = null
  return commit(record)
}
export function setCoupon(record: CartRecord, code: string | null) {
  if (code && !record.items.length) throw new CartError(422, 'EMPTY_CART', 'Adicione um NFT antes de aplicar um cupom.')
  if (code === 'EXPIRADO' || (code && getCartScenario() === 'coupon-expired')) throw new CartError(422, 'COUPON_EXPIRED', 'Este cupom expirou.')
  if (code !== null && code !== 'KURIO10' && code !== 'BEMVINDO5') throw new CartError(422, 'COUPON_INVALID', 'Cupom inválido. Confira o código informado.')
  record.coupon = code
  return commit(record)
}
export function acceptPrices(record: CartRecord) {
  for (const item of record.items) item.acceptedPriceEth = assertQuantity(item.nftId, item.editionId, item.quantity).priceEth
  return commit(record)
}

// O marcador impede duplicar o mesmo lote em uma repetição após falha de limpeza.
export function mergeGuestCart(owner: string) {
  const guest = readCart()
  if (!guest.items.length) return
  const account = readCart(owner)
  const key = `migration:${guest.version}:${hashQuote(JSON.stringify(guest.items))}`
  if (!account.operations.some(operation => operation.key === key)) {
    for (const item of guest.items) {
      const existing = account.items.find(candidate => candidate.nftId === item.nftId && candidate.editionId === item.editionId)
      if (existing) existing.quantity += item.quantity
      else account.items.push({ ...item })
    }
    if (account.items.length > 50) throw new CartError(409, 'CART_LIMIT', 'Os carrinhos somam mais de 50 edições. Reduza o carrinho de visitante antes de entrar.')
    account.coupon ??= guest.coupon
    account.operations = [...account.operations.slice(-99), { key, signature: 'migration' }]
    commit(account)
  }
  saveCart({ ...emptyCart(), version: guest.version + 1 })
}

// O marcador e a subtração são gravados juntos; consultar o recibo não remove novas compras.
export function settlePurchasedItems(owner: string, orderId: string, items: { nftId: string; editionId: string; quantity: number }[]) {
  const record = readCart(owner)
  if (record.settledOrders.includes(orderId)) return
  for (const bought of items) {
    const current = record.items.find(item => item.nftId === bought.nftId && item.editionId === bought.editionId)
    if (current) current.quantity = Math.max(0, current.quantity - bought.quantity)
  }
  record.items = record.items.filter(item => item.quantity > 0)
  if (!record.items.length) record.coupon = null
  record.settledOrders.push(orderId)
  commit(record)
}
