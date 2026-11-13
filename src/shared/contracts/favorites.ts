import { z } from 'zod'
import { nftSchema } from './catalog'
export const favoritesSchema = z.object({ version: z.number().int().nonnegative(), ids: z.array(z.string()), items: z.array(nftSchema) })
export type Favorites = z.infer<typeof favoritesSchema>
