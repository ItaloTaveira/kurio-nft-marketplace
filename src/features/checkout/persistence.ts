import { z } from 'zod'
import { checkoutQuoteSchema, checkoutSelectionSchema, type CheckoutSelection, type CheckoutQuote } from '@/shared/contracts/checkout'
const attemptSchema = z.object({ key: z.string().uuid(), quote: checkoutQuoteSchema })
export type CheckoutAttempt = z.infer<typeof attemptSchema>
const draftKey = (owner: string) => `kurio:checkout-draft:${owner}`
const attemptKey = (owner: string) => `kurio:checkout-attempt:${owner}`
export function readDraft(owner: string): CheckoutSelection | null {
  try { return checkoutSelectionSchema.parse(JSON.parse(sessionStorage.getItem(draftKey(owner)) ?? 'null')) } catch { return null }
}
export function saveDraft(owner: string, draft: unknown) {
  const parsed = checkoutSelectionSchema.safeParse(draft)
  if (parsed.success) sessionStorage.setItem(draftKey(owner), JSON.stringify(parsed.data))
}
export function readAttempt(owner: string): CheckoutAttempt | null {
  try { return attemptSchema.parse(JSON.parse(sessionStorage.getItem(attemptKey(owner)) ?? 'null')) } catch { return null }
}
export function saveAttempt(owner: string, quote: CheckoutQuote, key: string = crypto.randomUUID()): CheckoutAttempt {
  const attempt = { key, quote }
  sessionStorage.setItem(attemptKey(owner), JSON.stringify(attemptSchema.parse(attempt)))
  return attempt
}
export function clearAttempt(owner: string, quoteId?: string) {
  const current = readAttempt(owner)
  if (!quoteId || current?.quote.id === quoteId) sessionStorage.removeItem(attemptKey(owner))
}
