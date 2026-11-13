import { z } from 'zod'
import { orderSchema } from './checkout'

// A coleção usa apenas os snapshots de compras confirmadas da conta autenticada.
export const walletCollectionSchema = z.object({ orders: z.array(orderSchema) })
