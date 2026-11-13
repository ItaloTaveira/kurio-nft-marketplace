import { realtimeHandlers } from './events/socket'
import { favoritesHandlers } from './handlers/favorites'
import { checkoutHandlers } from './handlers/checkout'
import { accountHandlers } from './handlers/account'
import { authHandlers } from './handlers/auth'
import { setupWorker } from 'msw/browser'
import { catalogHandlers } from './handlers/catalog'
import { nftHandlers } from './handlers/nft'
import { cartHandlers } from './handlers/cart'

export const worker = setupWorker(...realtimeHandlers, ...favoritesHandlers, ...checkoutHandlers, ...accountHandlers, ...authHandlers, ...catalogHandlers, ...nftHandlers, ...cartHandlers)
