import { useEffect, useRef } from 'react'
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSessionToken, useSessionToken } from '@/shared/api/session-token'
import { checkoutAction, getCheckout, getOrder, type CheckoutAction } from './api'
import type { CheckoutAttempt } from './persistence'
import { clearAttempt } from './persistence'
import { useSession } from '@/features/auth/queries'

export function useCheckout() {
  const token = useSessionToken()
  const pending = useIsMutating({ mutationKey: ['checkout-mutation'] }) > 0
  return { ...useQuery({ queryKey: ['account', token, 'checkout'], queryFn: ({ signal }) => getCheckout(token, signal), enabled: !!token && !pending, staleTime: 0, refetchOnWindowFocus: true, refetchOnReconnect: true }), pending }
}
export function useCheckoutCommands() {
  const token = useSessionToken()
  const client = useQueryClient()
  const mutation = useMutation({ mutationKey: ['checkout-mutation'], scope: { id: 'checkout' }, retry: false,
    mutationFn: ({ token, action }: { token: string; action: CheckoutAction }) => checkoutAction(token, action),
    onMutate: ({ token }) => client.cancelQueries({ queryKey: ['account', token, 'checkout'] }),
    onSuccess: (response, { token }) => {
      if (getSessionToken() !== token) return
      if (response.type === 'order') client.setQueryData(['account', token, 'order', response.data.id], response.data)
      if (response.type !== 'quote') void client.invalidateQueries({ queryKey: ['account', token, 'checkout'] })
      if (response.type === 'order') { void client.invalidateQueries({ queryKey: ['cart', token] }); void client.invalidateQueries({ queryKey: ['nft'] }); void client.invalidateQueries({ queryKey: ['catalog'] }) }
    },
    onError: (_error, { token }) => { if (getSessionToken() === token) void client.invalidateQueries({ queryKey: ['account', token, 'checkout'] }) },
  })
  return { ...mutation, mutateAsync: (action: CheckoutAction) => mutation.mutateAsync({ token, action }) }
}
export function usePreviousAttempt(attempt: CheckoutAttempt | null, pending: boolean) {
  const token = useSessionToken()
  return useQuery({ queryKey: ['account', token, 'attempt', attempt?.key], queryFn: ({ signal }) => getOrder(token, attempt!.key, signal, true), enabled: !!token && !!attempt && !pending, staleTime: 0, refetchOnWindowFocus: true, refetchOnReconnect: true })
}
export function useOrder(id: string) {
  const token = useSessionToken()
  const session = useSession()
  const client = useQueryClient()
  const reconciled = useRef('')
  const query = useQuery({ queryKey: ['account', token, 'order', id], queryFn: ({ signal }) => getOrder(token, id, signal), enabled: !!token, staleTime: 0, refetchOnWindowFocus: true, refetchOnReconnect: true, refetchInterval: query => query.state.data?.status === 'pending' ? 5000 : false })
  useEffect(() => {
    const order = query.data
    if (!order || getSessionToken() !== token || reconciled.current === `${id}:${order.status}`) return
    reconciled.current = `${id}:${order.status}`
    void client.invalidateQueries({ queryKey: ['cart', token] })
    void client.invalidateQueries({ queryKey: ['account', token, 'checkout'] })
    void client.invalidateQueries({ queryKey: ['catalog'] })
    void client.invalidateQueries({ queryKey: ['nft'] })
    if (order.status !== 'pending' && session.data) { try { clearAttempt(session.data.user.id, order.quoteId) } catch { /* A referência persistida permite consultar o mesmo recibo novamente. */ } }
  }, [query.data, token, id, client, session.data])
  return query
}
