import { queryOptions } from '@tanstack/react-query'
import { getNft } from './api'

export function nftQuery(nftId: string) {
  return queryOptions({ queryKey: ['nft', nftId] as const, queryFn: ({ signal }) => getNft(nftId, signal) })
}
