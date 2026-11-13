import { z } from 'zod'
import { ethSchema, nftSchema } from './catalog'

export const editionSchema = z.object({
  id: z.string(), label: z.string(), priceEth: ethSchema,
  remaining: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
})
export type NftEdition = z.infer<typeof editionSchema>

export const reviewSchema = z.object({
  id: z.string(), author: z.string(), rating: z.number().int().min(1).max(5),
  date: z.string().datetime(), text: z.string(),
})
export const nftDetailSchema = nftSchema.extend({
  tokenId: z.string(), collectionName: z.string(), creator: z.string(),
  description: z.string(), mobileDescription: z.string(),
  paragraphs: z.array(z.string()).min(1), attributes: z.array(z.string()),
  contract: z.string(), standard: z.string(), royaltyPercent: z.string(),
  gallery: z.array(z.object({ id: z.string(), src: z.string(), alt: z.string() })).min(1),
  defaultEditionId: z.string(), editions: z.array(editionSchema).min(1),
  reviews: z.array(reviewSchema),
  rating: z.object({ value: z.number().min(0).max(5), count: z.number().int().nonnegative() }),
  related: z.array(nftSchema),
})
export type NftDetail = z.infer<typeof nftDetailSchema>

export const nftSearchSchema = z.object({
  edition: z.string().regex(/^[a-z0-9-]{1,64}$/).optional().catch(undefined),
  quantity: z.coerce.number().int().min(1).max(100).catch(1),
  // Apenas a rota pública do catálogo pode ser usada como destino de retorno.
  returnTo: z.string().max(2000).regex(/^\/(?:\?[^#]*)?(?:#mercado)?$/).optional().catch(undefined),
})
export type NftSearch = z.output<typeof nftSearchSchema>
export const defaultNftSearch = nftSearchSchema.parse({})
