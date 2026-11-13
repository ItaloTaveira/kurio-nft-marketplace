import { z } from 'zod'
import { ethSchema } from '@/shared/contracts/catalog'
import { publish } from '@/mocks/events/bus'
const overridesSchema = z.record(z.string(), z.object({ version: z.number().int().nonnegative(), priceEth: ethSchema.optional(), remaining: z.number().int().nonnegative().optional() }))
const key = 'kurio:marketplace-overrides:v1'
function records() { return overridesSchema.parse(JSON.parse(localStorage.getItem(key) ?? '{}')) }
export function marketplaceOverride(id: string) { return records()[id] }
export function changeMarketplace(id: string, patch: { priceEth?: string; remaining?: number } = {}, mode = 'normal') {
  const all = records()
  const current = all[id] ?? { version: 0 }
  if (mode === 'old') { publish({ type: 'nft.updated', data: { eventId: crypto.randomUUID(), nftId: id, version: Math.max(0, current.version - 1) } }); return current }
  if (mode !== 'duplicate') { all[id] = { ...current, ...patch, version: current.version + 1 }; localStorage.setItem(key, JSON.stringify(all)) }
  const next = all[id] ?? current
  const event = { type: 'nft.updated' as const, data: { eventId: crypto.randomUUID(), nftId: id, version: next.version } }
  publish(event)
  if (mode === 'duplicate') publish(event)
  return next
}
