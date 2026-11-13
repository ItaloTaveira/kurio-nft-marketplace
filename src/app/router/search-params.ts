// Preserva strings decimais, inclusive zeros finais e até 18 casas de ETH.
// A serialização JSON padrão converteria ?minPrice=0.999999999999999999 em number.
export function parseSearch(query: string): Record<string, unknown> {
  const values: Record<string, unknown> = Object.fromEntries(new URLSearchParams(query))
  for (const key of ['collections', 'networks']) {
    const raw = values[key]
    if (typeof raw !== 'string') continue
    try { values[key] = JSON.parse(raw) } catch { values[key] = raw.split(',').filter(Boolean) }
  }
  return values
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined) params.set(key, Array.isArray(value) ? JSON.stringify(value) : String(value))
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}
