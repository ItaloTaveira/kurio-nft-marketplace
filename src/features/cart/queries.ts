import { getSessionToken, useSessionToken } from '@/shared/api/session-token'
import { queryOptions, useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CartResponse } from '@/shared/contracts/cart'
import { changeCart, getCart, type CartAction } from './api'

const mutationKey = ['cart-mutation'] as const
export function cartQuery(owner = 'guest') {
  return queryOptions({ queryKey: ['cart', owner], queryFn: ({ signal }) => getCart(signal, owner), staleTime: 5000, refetchOnMount: 'always', refetchOnWindowFocus: 'always' })
}
export function useCart() {
  const owner = useSessionToken() || 'guest'
  const pending = useIsMutating({ mutationKey }) > 0
  return { ...useQuery({ ...cartQuery(owner), enabled: !pending }), pending }
}
export function useCartCommands() {
  const client = useQueryClient()
  const owner = useSessionToken() || 'guest'
  const mutation = useMutation({
    mutationKey, scope: { id: 'cart' }, retry: false,
    // A identidade pertence à tentativa, mesmo se o componente renderizar outra sessão.
    mutationFn: ({ action, owner }: { action: CartAction; owner: string }) => changeCart(action, owner),
    onMutate: async ({ action, owner }) => {
      const cartKey = ['cart', owner] as const
      await client.cancelQueries({ queryKey: cartKey })
      if ((getSessionToken() || 'guest') !== owner) return { previous: undefined }
      const previous = client.getQueryData<CartResponse>(cartKey)
      if (action.type === 'remove' && previous) {
        const items = previous.items.filter(item => item.id !== action.itemId)
        // Totais monetários aguardam a API; a UI os mascara enquanto há mutation.
        client.setQueryData<CartResponse>(cartKey, { ...previous, items, itemCount: items.length, totalQuantity: items.reduce((total, item) => total + item.quantity, 0) })
      }
      return { previous }
    },
    onSuccess: (data, { owner }) => {
      if ((getSessionToken() || 'guest') !== owner) return
      client.setQueryData<CartResponse>(['cart', owner], current => !current || current.version <= data.version ? data : current)
    },
    onError: (_error, { action, owner }, context) => {
      if ((getSessionToken() || 'guest') !== owner) return
      const cartKey = ['cart', owner] as const
      const current = client.getQueryData<CartResponse>(cartKey)
      if (context?.previous && (!current || current.version === context.previous.version)) client.setQueryData(cartKey, context.previous)
      if (action.type === 'add') void client.invalidateQueries({ queryKey: ['nft', action.item.nftId] })
    },
    onSettled: (_data, _error, { owner }) => {
      if (client.isMutating({ mutationKey }) === 1 && (getSessionToken() || 'guest') === owner) void client.invalidateQueries({ queryKey: ['cart', owner] })
    },
  })
  return { ...mutation, mutateAsync: (action: CartAction) => mutation.mutateAsync({ action, owner }) }
}
