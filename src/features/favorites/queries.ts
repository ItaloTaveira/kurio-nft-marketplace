import { useIsMutating, useMutationState, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/shared/api/http'
import { getSessionToken, useSessionToken } from '@/shared/api/session-token'
import { favoritesSchema, type Favorites } from '@/shared/contracts/favorites'
export function useFavorites() {
  const token = useSessionToken()
  const pending = useIsMutating({ mutationKey: ['favorites-mutation'] }) > 0
  return { ...useQuery({ queryKey: ['account', token, 'favorites'], queryFn: async ({ signal }) => favoritesSchema.parse((await http.get('/favorites', { signal, headers: { Authorization: `Bearer ${token}` } })).data), enabled: !!token && !pending, refetchOnWindowFocus: true }), pending }
}
export function useFavoriteCommands() {
  const client = useQueryClient()
  const token = useSessionToken()
  const mutation = useMutation({ mutationKey: ['favorites-mutation'], scope: { id: 'favorites' }, retry: false,
    mutationFn: async ({ token, id, add }: { token: string; id: string; add: boolean }) => favoritesSchema.parse((await http.request({ method: add ? 'PUT' : 'DELETE', url: `/favorites/${encodeURIComponent(id)}`, headers: { Authorization: `Bearer ${token}` } })).data),
    onMutate: async ({ token, id, add }) => {
      const key = ['account', token, 'favorites']
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<Favorites>(key)
      if (previous && getSessionToken() === token) client.setQueryData(key, { ...previous, ids: add ? [...new Set([...previous.ids, id])] : previous.ids.filter(value => value !== id), items: add ? previous.items : previous.items.filter(item => item.id !== id) })
      return { previous }
    },
    onSuccess: (data, { token }) => { if (getSessionToken() === token) client.setQueryData<Favorites>(['account', token, 'favorites'], current => !current || current.version <= data.version ? data : current) },
    onError: (_error, { token }, context) => { if (getSessionToken() === token && context?.previous) client.setQueryData(['account', token, 'favorites'], context.previous) },
    onSettled: (_data, _error, { token }) => { if (getSessionToken() === token) void client.invalidateQueries({ queryKey: ['account', token, 'favorites'] }) },
  })
  return { ...mutation, mutateAsync: (id: string, add: boolean) => mutation.mutateAsync({ token, id, add }) }
}

export function useFavoriteError() {
  const token = useSessionToken()
  const states = useMutationState({ filters: { mutationKey: ['favorites-mutation'] }, select: mutation => ({ token: (mutation.state.variables as { token?: string } | undefined)?.token, status: mutation.state.status, error: mutation.state.error }) })
  const latest = states.filter(state => state.token === token).at(-1)
  return latest?.status === 'error' ? latest.error : null
}
