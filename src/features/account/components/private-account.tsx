import { isPrivatePath } from '@/shared/contracts/auth'
import { useEffect, type PropsWithChildren } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/features/auth/queries'
import { useSessionToken } from '@/shared/api/session-token'
import { Button } from '@/shared/ui/button'

export function PrivateAccount({ children }: PropsWithChildren) {
  const token = useSessionToken()
  const session = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (!isPrivatePath(location.pathname)) return
    if (!token || (session.isSuccess && !session.data)) void navigate({ to: '/entrar', search: { returnTo: `${location.pathname}${location.searchStr}`, expired: !!sessionStorage.getItem('kurio:session-expired') }, replace: true })
  }, [token, session.isSuccess, session.data, navigate, location.pathname, location.searchStr])
  if (token && session.isError) return <main id="conteudo" className="page-container py-12"><h1>Não foi possível verificar sua sessão</h1><Button className="mt-6" onClick={() => void session.refetch()}>Tentar novamente</Button></main>
  if (!token || !session.data) return <main className="page-container py-12" role="status" aria-label="Verificando sessão"><div className="h-80 rounded-lg bg-card skeleton-shimmer" /></main>
  return children
}
