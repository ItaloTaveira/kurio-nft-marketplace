import { http } from '@/shared/api/http'
import { nftDetailSchema } from '@/shared/contracts/nft'

export async function getNft(nftId: string, signal: AbortSignal) {
  const { data } = await http.get<unknown>(`/nfts/${encodeURIComponent(nftId)}`, { signal })
  return nftDetailSchema.parse(data)
}
