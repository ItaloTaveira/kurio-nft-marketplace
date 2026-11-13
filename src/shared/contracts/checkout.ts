import { z } from 'zod'
import { registerSchema } from './auth'
import { networkIds, ethSchema } from './catalog'
import { providers, walletsSchema } from './account'
import { cartItemSchema, cartResponseSchema } from './cart'

export const connectionInputSchema = z.object({ walletSlot: z.enum(['primary', 'secondary']), network: z.enum(networkIds), provider: z.enum(providers) })
export const checkoutSelectionSchema = connectionInputSchema.extend({ name: registerSchema.shape.name, email: registerSchema.shape.email, notes: z.string().max(1000).optional() })
export type CheckoutSelection = z.infer<typeof checkoutSelectionSchema>
export type ConnectionInput = z.infer<typeof connectionInputSchema>
export const connectionSchema = connectionInputSchema.extend({ id: z.string().uuid(), address: z.string(), alias: z.string(), expiresAt: z.string().datetime() })
export const orderSnapshotSchema = z.object({
  collector: z.object({ name: z.string(), email: z.string().email(), notes: z.string().max(1000).optional() }),
  wallet: connectionInputSchema.extend({ address: z.string(), alias: z.string() }),
  items: z.array(cartItemSchema).min(1),
  subtotalEth: ethSchema, discountEth: ethSchema, networkFeeEth: ethSchema, totalEth: ethSchema,
  coupon: z.string().nullable(), currency: z.literal('ETH'), cartVersion: z.number().int().nonnegative(),
})
export const checkoutQuoteSchema = z.object({ id: z.string().uuid(), connectionId: z.string().uuid(), selection: checkoutSelectionSchema, snapshot: orderSnapshotSchema, createdAt: z.string().datetime(), expiresAt: z.string().datetime() })
export type CheckoutQuote = z.infer<typeof checkoutQuoteSchema>
export const quoteInputSchema = checkoutSelectionSchema.extend({ connectionId: z.string().uuid() })
export const submitOrderSchema = z.object({ quoteId: z.string().uuid() })
export const orderSchema = z.object({
  version: z.number().int().positive().default(1), id: z.string().uuid(), quoteId: z.string().uuid(), status: z.enum(['pending', 'confirmed', 'declined']),
  createdAt: z.string().datetime(), confirmedAt: z.string().datetime().nullable(),
  reason: z.string().nullable(), transactionReference: z.string().nullable(), snapshot: orderSnapshotSchema,
})
export type Order = z.infer<typeof orderSchema>
export const checkoutContextSchema = z.object({ collector: z.object({ name: z.string(), email: z.string().email(), notes: z.string().max(1000).optional() }), wallets: walletsSchema, connection: connectionSchema.nullable(), cart: cartResponseSchema, pendingOrderId: z.string().uuid().nullable() })
export type CheckoutContext = z.infer<typeof checkoutContextSchema>
