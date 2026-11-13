import { ws, http, HttpResponse } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { z } from 'zod'
import { listen } from './bus'
import { requireSession, resolveSession } from '@/mocks/database/auth'
import { getOrder } from '@/mocks/database/checkout'
import { withCartLock } from '@/mocks/database/cart'
import { changeMarketplace } from '@/mocks/database/marketplace-events'
import { catalogFixtures } from '@/mocks/fixtures/catalog'
import { ethSchema } from '@/shared/contracts/catalog'
// MSW normaliza /socket.io/ para / ao comparar a URL do handler.
const socket = ws.link(`${location.origin.replace(/^http/, 'ws')}/`)
const connections = new Set<() => void>()
let blockedUntil = 0
const commandSchema = z.discriminatedUnion('type', [z.object({ type: z.literal('nft'), nftId: z.string(), priceEth: ethSchema.optional(), remaining: z.number().int().nonnegative().optional(), mode: z.enum(['normal', 'duplicate', 'old']).default('normal') }), z.object({ type: z.literal('disconnect'), durationMs: z.number().int().min(100).max(10000).default(1500) })])
export const realtimeHandlers = [socket.addEventListener('connection', connection => {
  if (new URL(connection.client.url).searchParams.get('EIO') !== '4') { connection.server.connect(); return }
  if (Date.now() < blockedUntil) { connection.client.send('0' + JSON.stringify({ sid: 'outage', upgrades: [], pingInterval: 25000, pingTimeout: 5000 })); window.setTimeout(() => connection.client.close(1012, 'Simulated outage'), 50); return }
  const io = toSocketIo(connection)
  let request = new Request(`${location.origin}/api/socket`)
  let authenticated = false
  let orderId = ''
  let version = -1
  let closed = false
  let busy = false
  connection.client.addEventListener('message', event => {
    if (typeof event.data !== 'string' || !event.data.startsWith('40')) return
    try {
      const auth = JSON.parse(event.data.slice(2) || '{}') as { token?: string }
      request = new Request(`${location.origin}/api/socket`, { headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {} })
      resolveSession(request); authenticated = true
    } catch { connection.client.close(1008, 'Invalid session') }
  })
  const unsubscribe = listen(event => {
    if (closed || !authenticated) return
    try {
      const session = resolveSession(request)
      if (event.type === 'order.updated' && (!session || session.user.id !== event.data.owner || event.data.orderId !== orderId)) return
      io.client.emit(event.type, event.data)
    } catch { connection.client.close(1008, 'Session expired') }
  })
  io.client.on('subscribe-order', (_event, data: unknown) => { const parsed = z.object({ orderId: z.string().uuid() }).safeParse(data); if (parsed.success) { orderId = parsed.data.orderId; version = -1 } })
  const timer = window.setInterval(() => {
    if (busy || closed || !authenticated || !orderId) return
    busy = true
    void withCartLock(() => {
      const session = requireSession(request)
      const order = getOrder(request, orderId)
      if (!closed && order.version > version) { version = order.version; io.client.emit('order.updated', { eventId: `${order.id}:${order.version}`, orderId: order.id, owner: session.user.id, status: order.status, version: order.version }) }
    }).catch(() => { if (!closed) connection.client.close(1008, 'Order unavailable') }).finally(() => { busy = false })
  }, 400)
  const ping = window.setInterval(() => { if (!closed) connection.client.send('2') }, 20000)
  const disconnect = () => connection.client.close(1012, 'Simulated outage')
  connections.add(disconnect)
  connection.client.addEventListener('close', () => { closed = true; unsubscribe(); clearInterval(timer); clearInterval(ping); connections.delete(disconnect) })
}), http.post('*/api/mock/events', async ({ request }) => {
  const parsed = commandSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return HttpResponse.json({ message: 'Evento inválido.' }, { status: 422 })
  const command = parsed.data
  if (command.type === 'disconnect') { blockedUntil = Date.now() + command.durationMs; for (const close of connections) close(); return HttpResponse.json({ ok: true }) }
  if (!catalogFixtures.some(nft => nft.id === command.nftId)) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
  return withCartLock(() => HttpResponse.json(changeMarketplace(command.nftId, { ...(command.priceEth ? { priceEth: command.priceEth } : {}), ...(command.remaining === undefined ? {} : { remaining: command.remaining }) }, command.mode)))
})]
