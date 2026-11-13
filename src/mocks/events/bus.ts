import type { z } from 'zod'
import type { nftEventSchema, orderEventSchema } from '@/shared/contracts/realtime'
type Event = { type: 'nft.updated'; data: z.infer<typeof nftEventSchema> } | { type: 'order.updated'; data: z.infer<typeof orderEventSchema> }
const listeners = new Set<(event: Event) => void>()
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('kurio:events') : null
channel?.addEventListener('message', event => { for (const listener of listeners) listener(event.data as Event) })
export function publish(event: Event) { for (const listener of listeners) listener(event); channel?.postMessage(event) }
export function listen(listener: (event: Event) => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
