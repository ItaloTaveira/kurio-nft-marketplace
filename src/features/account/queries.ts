import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSessionToken, useSessionToken } from '@/shared/api/session-token'
import { sessionKey } from '@/features/auth/queries'
import type { Session } from '@/shared/contracts/auth'
import { getWalletCollection, generateDemoWalletAddress, changeAccount, getProfile, getWallets, type AccountAction } from './api'

export function useAccountResource(resource: 'profile' | 'wallets') {
  const token = useSessionToken()
  const pending = useIsMutating({ mutationKey: ['account-mutation'] }) > 0
  const profile = useQuery({ queryKey: ['account', token, 'profile'], queryFn: ({ signal }) => getProfile(token, signal), enabled: !!token && !pending && resource === 'profile', refetchOnWindowFocus: true })
  const wallets = useQuery({ queryKey: ['account', token, 'wallets'], queryFn: ({ signal }) => getWallets(token, signal), enabled: !!token && !pending && resource === 'wallets', refetchOnWindowFocus: true })
  return { profile, wallets, pending }
}
export function useAccountCommands() {
  const token = useSessionToken()
  const client = useQueryClient()
  const mutation = useMutation({ mutationKey: ['account-mutation'], scope: { id: 'account' }, retry: false,
    mutationFn: ({ token, action }: { token: string; action: AccountAction }) => changeAccount(token, action),
    onSuccess: (response, { token }) => {
      if (getSessionToken() !== token) return
      client.setQueryData(['account', token, response.type], response.data)
      void client.invalidateQueries({ queryKey: ['account', token, 'checkout'] })
      if (response.type === 'profile') client.setQueryData<Session | null>(sessionKey(token), session => session ? { ...session, user: { id: response.data.id, name: response.data.name, email: response.data.email } } : session)
    },
    onError: (_error, { token, action }) => {
      if (getSessionToken() === token) void client.invalidateQueries({ queryKey: ['account', token, action.type === 'profile' ? 'profile' : 'wallets'] })
    },
  })
  return { ...mutation, mutateAsync: (action: AccountAction) => mutation.mutateAsync({ token, action }) }
}

export function useDemoWalletAddress() {
  const token = useSessionToken()
  return useMutation({ retry: false, mutationFn: (network: Parameters<typeof generateDemoWalletAddress>[1]) => generateDemoWalletAddress(token, network) })
}

export function useWalletCollection() {
  const token = useSessionToken()
  return useQuery({ queryKey: ['account', token, 'collection'], enabled: !!token, queryFn: ({ signal }) => getWalletCollection(token, signal), staleTime: 0, refetchOnWindowFocus: true })
}
