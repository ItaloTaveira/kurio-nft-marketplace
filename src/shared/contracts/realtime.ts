import { z } from 'zod'
export const nftEventSchema = z.object({ eventId: z.string(), nftId: z.string(), version: z.number().int().nonnegative() })
export const orderEventSchema = z.object({ eventId: z.string(), orderId: z.string(), owner: z.string(), version: z.number().int().nonnegative(), status: z.enum(['pending', 'confirmed', 'declined']) })
