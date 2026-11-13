import { z } from 'zod'
import { ethSchema, nftSchema, networkIds } from './catalog'
import { nftSearchSchema } from './nft'

export const cartSearchSchema = z.object({ returnTo: nftSearchSchema.shape.returnTo })
export type CartSearch = z.infer<typeof cartSearchSchema>
export const addCartItemSchema = z.object({ nftId: z.string().min(1), editionId: z.string().min(1), quantity: z.number().int().min(1).max(100), expectedUnitPriceEth: ethSchema })
export type AddCartItem = z.infer<typeof addCartItemSchema>
export const cartQuantitySchema = z.object({ quantity: z.number().int().min(1).max(100) })
export const cartCouponSchema = z.object({ code: z.string().trim().min(1).max(32).transform(value => value.toUpperCase()) })
export const cartItemSchema = z.object({
  network: z.enum(networkIds), id: z.string(), nftId: z.string(), editionId: z.string(), name: z.string(), image: z.string(), imageAlt: z.string(), tokenId: z.string(), editionLabel: z.string(),
  quantity: z.number().int().positive(), maxQuantity: z.number().int().nonnegative(),
  unitPriceEth: ethSchema, acceptedUnitPriceEth: ethSchema, lineTotalEth: ethSchema,
})
export type CartItem = z.infer<typeof cartItemSchema>
export const cartResponseSchema = z.object({
  version: z.number().int().nonnegative(), items: z.array(cartItemSchema),
  itemCount: z.number().int().nonnegative(), totalQuantity: z.number().int().nonnegative(),
  quote: z.object({
    id: z.string(), currency: z.literal('ETH'), subtotalEth: ethSchema, discountEth: ethSchema, networkFeeEth: ethSchema, totalEth: ethSchema,
    coupon: z.object({ code: z.string(), valid: z.boolean(), percentOff: z.number(), error: z.string().optional() }).nullable(),
    issues: z.array(z.object({ code: z.enum(['PRICE_CHANGED', 'STOCK_CHANGED', 'COUPON_EXPIRED']), itemId: z.string().optional(), message: z.string() })),
    requiresReview: z.boolean(), canCheckout: z.boolean(),
  }),
  recommendations: z.array(nftSchema),
})
export type CartResponse = z.infer<typeof cartResponseSchema>
