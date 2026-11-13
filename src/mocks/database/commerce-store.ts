import { z } from 'zod'
import { checkoutQuoteSchema, connectionSchema, orderSchema } from '@/shared/contracts/checkout'

const storedQuoteSchema = checkoutQuoteSchema.extend({ owner: z.string(), walletFingerprint: z.string() })
const storedConnectionSchema = connectionSchema.extend({ owner: z.string(), walletFingerprint: z.string() })
const storedOrderSchema = orderSchema.extend({ owner: z.string(), operationKey: z.string(), operationKeys: z.array(z.string()).default([]), outcome: z.enum(['confirmed', 'declined']), readyAt: z.number(), reservationExpiresAt: z.number(), connectionId: z.string() })
const commerceSchema = z.object({ quotes: z.array(storedQuoteSchema), connections: z.array(storedConnectionSchema), orders: z.array(storedOrderSchema) })
export type Commerce = z.infer<typeof commerceSchema>
export type StoredOrder = Commerce['orders'][number]
export const commerceStorageKey = 'kurio:commerce:v1'
export function readCommerce(): Commerce {
  const stored = localStorage.getItem(commerceStorageKey)
  return stored ? commerceSchema.parse(JSON.parse(stored)) : { quotes: [], connections: [], orders: [] }
}
export function saveCommerce(database: Commerce) { localStorage.setItem(commerceStorageKey, JSON.stringify(commerceSchema.parse(database))) }
// Pedidos pendentes reservam estoque por até 10 minutos, em todas as contas.
export function inventoryUsed(nftId: string, editionId: string, excludedOrderId?: string) {
  return readCommerce().orders.filter(order => order.id !== excludedOrderId && (order.status === 'confirmed' || (order.status === 'pending' && order.reservationExpiresAt > Date.now()))).reduce((total, order) => total + order.snapshot.items.filter(item => item.nftId === nftId && item.editionId === editionId).reduce((sum, item) => sum + item.quantity, 0), 0)
}
