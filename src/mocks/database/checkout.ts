import { networkFee } from './network-fees'
import { publish } from '@/mocks/events/bus'
import { changeMarketplace } from './marketplace-events'
import Decimal from 'decimal.js'
import { checkoutQuoteSchema, connectionSchema, orderSchema, type CheckoutSelection, type ConnectionInput, type CheckoutQuote } from '@/shared/contracts/checkout'
import { catalogFixtures } from '@/mocks/fixtures/catalog'
import { AuthError, requireSession } from './auth'
import { readProfile, readWallets } from './account'
import { cartResponse, readCart, settlePurchasedItems } from './cart'
import { readCommerce, saveCommerce, type Commerce, type StoredOrder } from './commerce-store'
import { resolveMarketplaceDetail } from './marketplace'

export const checkoutScenario = () => localStorage.getItem('kurio:checkout-scenario') ?? 'success'
const fail = (code: string, message: string, status = 409): never => { throw new AuthError(status, code, message) }
function selectedWallet(request: Request, input: ConnectionInput) {
  const wallets = readWallets(request)
  const wallet = input.walletSlot === 'secondary' && wallets.secondarySameAsPrimary ? wallets.primary : wallets[input.walletSlot]
  if (!wallet) return fail('WALLET_REQUIRED', 'Cadastre a carteira selecionada antes de continuar.', 422)
  if (wallet.network !== input.network) return fail('NETWORK_MISMATCH', 'A rede escolhida precisa corresponder à carteira cadastrada.')
  if (input.network === 'solana' && input.provider === 'MetaMask') return fail('PROVIDER_MISMATCH', 'Escolha WalletConnect ou Coinbase Wallet para Solana.')
  return wallet
}
const walletFingerprint = (wallet: ReturnType<typeof selectedWallet>) => JSON.stringify(wallet)
function connectionFor(database: Commerce, request: Request, input: ConnectionInput, connectionId?: string) {
  const owner = requireSession(request).user.id
  const wallet = selectedWallet(request, input)
  const connection = database.connections.find(connection => connection.owner === owner && (!connectionId || connection.id === connectionId))
  if (!connection || connection.expiresAt <= new Date().toISOString() || checkoutScenario() === 'disconnected' || connection.walletSlot !== input.walletSlot || connection.network !== input.network || connection.provider !== input.provider || connection.walletFingerprint !== walletFingerprint(wallet)) return fail('WALLET_DISCONNECTED', 'Conecte novamente a carteira e revise o pedido antes de confirmar.')
  return { connection, wallet }
}
export function connectWallet(request: Request, input: ConnectionInput) {
  const owner = requireSession(request).user.id
  const wallet = selectedWallet(request, input)
  if (checkoutScenario() === 'connection-refused') return fail('CONNECTION_REFUSED', 'A conexão foi recusada pela carteira simulada. Tente novamente.', 422)
  const database = readCommerce()
  const connection = { ...input, owner, id: crypto.randomUUID(), address: wallet.address, alias: wallet.alias, expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(), walletFingerprint: walletFingerprint(wallet) }
  database.connections = [...database.connections.filter(connection => connection.owner !== owner), connection]
  saveCommerce(database)
  return connectionSchema.parse(connection)
}
export function disconnectWallet(request: Request, id: string) {
  const owner = requireSession(request).user.id
  const database = readCommerce()
  database.connections = database.connections.filter(connection => connection.owner !== owner || connection.id !== id)
  saveCommerce(database)
  return { ok: true }
}
function currentSnapshot(request: Request, selection: CheckoutSelection, connectionId: string, database: Commerce) {
  const owner = requireSession(request).user.id
  const { wallet } = connectionFor(database, request, selection, connectionId)
  const cart = cartResponse(readCart(owner))
  if (!cart.items.length) return fail('CART_EMPTY', 'Seu carrinho está vazio. Adicione um NFT para continuar.', 422)
  if (cart.quote.requiresReview) return fail('CART_REVIEW_REQUIRED', 'O carrinho mudou. Revise preços, estoque ou cupom no carrinho antes de continuar.')
  if (cart.items.some(item => item.network !== selection.network)) return fail('NETWORK_MISMATCH', 'Os NFTs do pedido devem estar na mesma rede da carteira. Separe os itens por rede no carrinho.')
  const fee = networkFee(selection.network)
  return { collector: { name: selection.name, email: selection.email }, wallet: { walletSlot: selection.walletSlot, network: selection.network, provider: selection.provider, address: wallet.address, alias: wallet.alias }, items: cart.items, subtotalEth: cart.quote.subtotalEth, discountEth: cart.quote.discountEth, networkFeeEth: fee, totalEth: new Decimal(cart.quote.subtotalEth).minus(cart.quote.discountEth).add(fee).toFixed(), coupon: cart.quote.coupon?.code ?? null, currency: 'ETH' as const, cartVersion: cart.version }
}
export function createQuote(request: Request, input: CheckoutSelection & { connectionId: string }) {
  const owner = requireSession(request).user.id
  const database = readCommerce()
  const { connection } = connectionFor(database, request, input, input.connectionId)
  const quote = { id: crypto.randomUUID(), owner, connectionId: input.connectionId, selection: { name: input.name, email: input.email, walletSlot: input.walletSlot, network: input.network, provider: input.provider }, snapshot: currentSnapshot(request, input, input.connectionId, database), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(), walletFingerprint: connection.walletFingerprint }
  database.quotes = [...database.quotes.slice(-199), quote]
  saveCommerce(database)
  return checkoutQuoteSchema.parse(quote)
}
// Compara o conteúdo real guardado pelo servidor, sem confiar em valores enviados pela UI.
const sameSnapshot = (left: CheckoutQuote['snapshot'], right: CheckoutQuote['snapshot']) => JSON.stringify(left) === JSON.stringify(right)
export function submitOrder(request: Request, quoteId: string, operationKey: string) {
  const owner = requireSession(request).user.id
  if (!/^[a-zA-Z0-9-]{16,100}$/.test(operationKey)) return fail('IDEMPOTENCY_REQUIRED', 'Identifique a tentativa antes de enviar o pedido.', 400)
  const database = readCommerce()
  const existingKey = database.orders.find(order => order.owner === owner && (order.operationKey === operationKey || order.operationKeys.includes(operationKey)))
  if (existingKey) {
    if (existingKey.quoteId !== quoteId) return fail('IDEMPOTENCY_CONFLICT', 'Esta tentativa pertence a outro pedido.')
    return orderSchema.parse(existingKey)
  }
  const existingQuote = database.orders.find(order => order.owner === owner && order.quoteId === quoteId)
  if (existingQuote) { existingQuote.operationKeys.push(operationKey); saveCommerce(database); return orderSchema.parse(existingQuote) }
  if (database.orders.some(order => order.owner === owner && order.status === 'pending')) return fail('ORDER_PENDING', 'Você já tem um pedido pendente. Consulte seu andamento antes de tentar outra compra.')
  const quote = database.quotes.find(quote => quote.id === quoteId && quote.owner === owner)
  if (!quote || Date.parse(quote.expiresAt) <= Date.now()) return fail('QUOTE_EXPIRED', 'A revisão expirou. Revise o pedido novamente antes de confirmar.')
  const fresh = currentSnapshot(request, quote.selection, quote.connectionId, database)
  if (!sameSnapshot(fresh, quote.snapshot)) return fail('QUOTE_CHANGED', 'Os valores ou itens mudaram. Revise o pedido novamente para confirmar os novos dados.')
  const order: StoredOrder = { version: 1, id: crypto.randomUUID(), quoteId, owner, operationKey, operationKeys: [], status: 'pending', createdAt: new Date().toISOString(), confirmedAt: null, reason: null, transactionReference: null, snapshot: quote.snapshot, outcome: checkoutScenario() === 'declined' ? 'declined' : 'confirmed', readyAt: Date.now() + 2200, reservationExpiresAt: Date.now() + 10 * 60_000, connectionId: quote.connectionId }
  database.orders.push(order)
  saveCommerce(database)
  for (const item of order.snapshot.items) changeMarketplace(item.nftId)
  return orderSchema.parse(order)
}
function revalidatePending(request: Request, order: StoredOrder, database: Commerce) {
  connectionFor(database, request, order.snapshot.wallet, order.connectionId)
  if (order.reservationExpiresAt <= Date.now()) return fail('RESERVATION_EXPIRED', 'A reserva expirou. Revise o carrinho e tente novamente.')
  if (order.snapshot.coupon && localStorage.getItem('kurio:cart-scenario') === 'coupon-expired') return fail('COUPON_EXPIRED', 'O cupom expirou durante o processamento. Revise o carrinho e tente novamente.')
  if (networkFee(order.snapshot.wallet.network) !== order.snapshot.networkFeeEth) return fail('QUOTE_CHANGED', 'A taxa de rede mudou durante o processamento. Revise o pedido novamente.')
  for (const item of order.snapshot.items) {
    const nft = catalogFixtures.find(nft => nft.id === item.nftId)
    const edition = nft && resolveMarketplaceDetail(nft, order.id).editions.find(edition => edition.id === item.editionId)
    if (!edition || edition.remaining < item.quantity || !new Decimal(edition.priceEth).eq(item.unitPriceEth)) return fail('STOCK_OR_PRICE_CHANGED', 'Preço ou disponibilidade mudaram durante o processamento. Revise o carrinho e tente novamente.')
  }
}
function settle(request: Request, database: Commerce, order: StoredOrder) {
  if (order.status === 'pending' && order.readyAt <= Date.now() && checkoutScenario() !== 'pending') {
    try {
      if (order.outcome === 'declined') fail('PAYMENT_DECLINED', 'O pagamento foi recusado pela simulação. Seus itens continuam no carrinho.')
      revalidatePending(request, order, database)
      order.status = 'confirmed'; order.confirmedAt = new Date().toISOString(); order.transactionReference = `sim-${crypto.randomUUID()}`
    } catch (error) {
      if (!(error instanceof AuthError) || error.status === 401) throw error
      order.status = 'declined'; order.reason = error.message
    }
    order.version += 1
    saveCommerce(database)
    publish({ type: 'order.updated', data: { eventId: `${order.id}:${order.version}`, orderId: order.id, owner: order.owner, status: order.status, version: order.version } })
    for (const item of order.snapshot.items) changeMarketplace(item.nftId)
  }
  if (order.status === 'confirmed') settlePurchasedItems(order.owner, order.id, order.snapshot.items)
  return orderSchema.parse(order)
}
export function getOrder(request: Request, value: string, byKey = false) {
  const owner = requireSession(request).user.id
  const database = readCommerce()
  const order = database.orders.find(order => order.owner === owner && (byKey ? order.operationKey === value || order.operationKeys.includes(value) : order.id === value))
  if (!order) return fail('ORDER_NOT_FOUND', 'Pedido não encontrado nesta conta.', 404)
  return settle(request, database, order)
}
export function checkoutContext(request: Request) {
  const owner = requireSession(request).user.id
  const database = readCommerce()
  for (const order of database.orders.filter(order => order.owner === owner && (order.status === 'pending' || order.status === 'confirmed'))) settle(request, database, order)
  const profile = readProfile(request)
  const savedConnection = database.connections.find(connection => connection.owner === owner)
  let connection = null
  if (savedConnection) { try { connection = connectionSchema.parse(connectionFor(database, request, savedConnection, savedConnection.id).connection) } catch (error) { if (!(error instanceof AuthError) || error.status === 401) throw error } }
  return { collector: { name: profile.name, email: profile.email }, wallets: readWallets(request), connection, cart: cartResponse(readCart(owner)), pendingOrderId: database.orders.find(order => order.owner === owner && order.status === 'pending')?.id ?? null }
}
