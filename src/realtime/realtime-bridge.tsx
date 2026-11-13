import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation } from '@tanstack/react-router'
import { getSessionToken, useSessionToken } from '@/shared/api/session-token'
import { useSession } from '@/features/auth/queries'
import { nftEventSchema, orderEventSchema } from '@/shared/contracts/realtime'
import type { CartResponse } from '@/shared/contracts/cart'
import type { Order } from '@/shared/contracts/checkout'
export function RealtimeBridge() {
  const token = useSessionToken()
  const session = useSession()
  const owner = session.data?.user.id
  const client = useQueryClient()
  const location = useLocation()
  const orderId = /^\/pedidos\/([^/]+)$/.exec(location.pathname)?.[1]
  const [connected, setConnected] = useState<boolean | null>(null)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let active = true
    let hadConnection = false
    const versions = new Map<string, number>()
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, { transports: ['websocket'], auth: { token }, reconnectionDelay: 300, reconnectionDelayMax: 1500, randomizationFactor: 0 })
    const valid = () => active && getSessionToken() === token
    const reconcile = () => { for (const key of [['catalog'], ['nft'], ['cart', token || 'guest'], ['account', token]]) void client.invalidateQueries({ queryKey: key }) }
    socket.on('connect', () => { if (!valid()) return; setConnected(true); if (hadConnection) { reconcile() } hadConnection = true; if (orderId && token) socket.emit('subscribe-order', { orderId }) })
    socket.on('disconnect', () => { if (valid()) setConnected(false) })
    socket.on('connect_error', () => { if (valid()) setConnected(false) })
    socket.on('nft.updated', (payload: unknown) => {
      const parsed = nftEventSchema.safeParse(payload)
      if (!valid() || !parsed.success) return
      const event = parsed.data
      const key = `nft:${event.nftId}`
      if (event.version <= (versions.get(key) ?? -1)) return
      versions.set(key, event.version)
      void client.invalidateQueries({ queryKey: ['catalog'] }); void client.invalidateQueries({ queryKey: ['nft', event.nftId] }); void client.invalidateQueries({ queryKey: ['account', token, 'favorites'] }); void client.invalidateQueries({ queryKey: ['cart', token || 'guest'] }); void client.invalidateQueries({ queryKey: ['account', token, 'checkout'] })
      const cart = client.getQueryData<CartResponse>(['cart', token || 'guest'])
      if (!orderId && cart?.items.some(item => item.nftId === event.nftId)) setNotice('Preço ou disponibilidade alterados. Confira os valores atualizados no carrinho antes de confirmar.')
    })
    socket.on('order.updated', (payload: unknown) => {
      const parsed = orderEventSchema.safeParse(payload)
      if (!valid() || !parsed.success || parsed.data.owner !== owner || parsed.data.orderId !== orderId) return
      const event = parsed.data
      const key = `order:${event.orderId}`
      const cached = client.getQueryData<Order>(['account', token, 'order', event.orderId])
      if (event.version <= Math.max(versions.get(key) ?? -1, cached?.version ?? -1) || (cached && cached.status !== 'pending')) return
      versions.set(key, event.version)
      void client.invalidateQueries({ queryKey: ['account', token, 'order', event.orderId] })
    })
    return () => { active = false; socket.removeAllListeners(); socket.disconnect() }
  }, [token, owner, orderId, client])
  return <><span className="sr-only" data-testid="realtime-state">{connected === true ? 'Conectado' : connected === false ? 'Reconectando' : 'Conectando'}</span>{connected === false && <p role="status" className="realtime-status">Conexão ao vivo interrompida. Reconectando…</p>}{notice && <div role="status" className="realtime-notice"><p>{notice}</p><button type="button" onClick={() => setNotice('')} aria-label="Fechar aviso de atualização">Fechar</button></div>}</>
}
