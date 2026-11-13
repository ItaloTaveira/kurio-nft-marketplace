import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { http } from '@/shared/api/http'
import { getSessionToken, setSessionToken, useSessionToken } from '@/shared/api/session-token'
import { authResponseSchema, sessionSchema, type LoginInput, type RegisterInput, type Session } from '@/shared/contracts/auth'

export const sessionKey = (token: string) => ['session', token] as const
export function useSession() {
  const token = useSessionToken()
  return useQuery({ queryKey: sessionKey(token), queryFn: async ({ signal }) => {
    try { return sessionSchema.nullable().parse((await http.get('/auth/session', { signal })).data) }
    catch (error) { if (isAxiosError(error) && error.response?.status === 401) return null; throw error }
  }, staleTime: 15000, refetchOnWindowFocus: true })
}
export function SessionLifecycle() {
  const token = useSessionToken()
  const previous = useRef(token)
  const client = useQueryClient()
  const session = useSession()
  useEffect(() => {
    if (previous.current !== token) {
      const old = previous.current
      previous.current = token
      void client.cancelQueries({ queryKey: ['cart', old || 'guest'] })
      client.removeQueries({ queryKey: ['cart', old || 'guest'] })
      void client.cancelQueries({ queryKey: ['account', old] })
      client.removeQueries({ queryKey: ['account', old] })
      client.removeQueries({ queryKey: sessionKey(old) })
    }
  }, [token, client])
  useEffect(() => {
    if (!token || !session.data) return
    const timeout = window.setTimeout(() => {
      if (getSessionToken() === token) setSessionToken('', true)
    }, Math.max(0, Date.parse(session.data.expiresAt) - Date.now()))
    return () => clearTimeout(timeout)
  }, [token, session.data])
  return null
}
export function useAuthenticate() {
  const client = useQueryClient()
  return useMutation({ retry: false, scope: { id: 'auth' }, mutationFn: async (input: { mode: 'login'; values: LoginInput } | { mode: 'register'; values: RegisterInput }) => authResponseSchema.parse((await http.post(`/auth/${input.mode}`, input.values)).data),
    onSuccess: async response => {
      await client.cancelQueries({ queryKey: ['cart'] })
      client.removeQueries({ queryKey: ['cart'] })
      await client.cancelQueries({ queryKey: ['account'] })
      client.removeQueries({ queryKey: ['account'] })
      client.removeQueries({ queryKey: ['session'] })
      const { token, ...session } = response
      client.setQueryData<Session>(sessionKey(token), session)
      setSessionToken(token)
    },
  })
}
export function useLogout() {
  const client = useQueryClient()
  return useMutation({ retry: false, mutationFn: async () => { await http.post('/auth/logout') }, onSuccess: async () => {
    await client.cancelQueries({ queryKey: ['cart'] })
    client.removeQueries({ queryKey: ['cart'] })
    await client.cancelQueries({ queryKey: ['account'] })
    client.removeQueries({ queryKey: ['account'] })
    client.removeQueries({ queryKey: ['session'] })
    setSessionToken('')
  } })
}
