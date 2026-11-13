import { z } from 'zod'
import Decimal from 'decimal.js'

export const collections = [
  { id: 'digital-art', label: 'Arte digital' },
  { id: 'photography', label: 'Fotografia' },
  { id: 'music', label: 'Música' },
  { id: '3d-art', label: 'Arte 3D' },
  { id: 'collectibles', label: 'Colecionáveis' },
  { id: 'generative', label: 'Generativa' },
  { id: 'gaming', label: 'Jogos' },
  { id: 'memberships', label: 'Assinaturas' },
  { id: 'utility', label: 'Utilidade' },
] as const
export const networkIds = ['ethereum', 'polygon', 'solana'] as const
export const networkLabels = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }
export const collectionIds = collections.map(item => item.id)
export const sortOptions = [
  { id: 'recent', label: 'Listados recentemente' },
  { id: 'price-asc', label: 'Menor preço' },
  { id: 'price-desc', label: 'Maior preço' },
] as const
export const catalogTabs = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
] as const
export const ethSchema = z.string().regex(/^\d{1,6}(\.\d{1,18})?$/)
const collectionSchema = z.enum(collectionIds)
const networkSchema = z.enum(networkIds)
const ids = <T extends z.ZodType<string>>(schema: T) => z.array(schema).max(20).catch([]).transform(value => [...new Set(value)].sort())

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(120).catch(''),
  collections: ids(collectionSchema),
  networks: ids(networkSchema),
  minPrice: ethSchema.optional().catch(undefined),
  maxPrice: ethSchema.optional().catch(undefined),
  sort: z.enum(['recent', 'price-asc', 'price-desc']).catch('recent'),
  tab: z.enum(['all', 'new', 'trending']).catch('all'),
  page: z.coerce.number().int().min(1).max(10000).catch(1),
}).transform(search => {
  if (search.minPrice && search.maxPrice && new Decimal(search.minPrice).gt(search.maxPrice)) {
    return { ...search, minPrice: undefined, maxPrice: undefined }
  }
  return search
})
export type CatalogSearch = z.output<typeof catalogSearchSchema>
export const defaultCatalogSearch = catalogSearchSchema.parse({})

export const nftSchema = z.object({
  id: z.string(), name: z.string(), image: z.string(), imageAlt: z.string(),
  priceEth: ethSchema, previousPriceEth: ethSchema.optional(),
  collection: collectionSchema, network: networkSchema,
  listedAt: z.string().datetime(), popularity: z.number(), isNew: z.boolean(),
  imageLayout: z.enum(['square', 'portrait']),
})
export type Nft = z.infer<typeof nftSchema>
export const catalogResponseSchema = z.object({
  items: z.array(nftSchema), total: z.number().int().nonnegative(),
  page: z.number().int().positive(), pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  facets: z.object({ collections: z.record(z.string(), z.number()), networks: z.record(z.string(), z.number()) }),
})
export type CatalogResponse = z.infer<typeof catalogResponseSchema>
