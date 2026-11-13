import { requireSession } from './auth'
import { readCommerce } from './commerce-store'
import { walletCollectionSchema } from '@/shared/contracts/wallet-collection'

export function readWalletCollection(request: Request) {
  const owner = requireSession(request).user.id
  return walletCollectionSchema.parse({ orders: readCommerce().orders.filter(order => order.owner === owner && order.status === 'confirmed') })
}
