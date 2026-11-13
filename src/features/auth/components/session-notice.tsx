import { Link, useLocation } from '@tanstack/react-router'
import { useSessionToken } from '@/shared/api/session-token'
export function SessionNotice() {
  const token = useSessionToken()
  const location = useLocation()
  if (token || !sessionStorage.getItem('kurio:session-expired') || ['/entrar', '/cadastro'].includes(location.pathname)) return null
  return <aside role="alert" className="border-b border-border bg-card px-6 py-3 text-center text-sm">Sua sessão expirou. <Link to="/entrar" search={{ returnTo: `${location.pathname}${location.searchStr}${location.hash ? `#${location.hash}` : ''}`, expired: true }} className="text-accent underline">Entre novamente para continuar</Link>. Seu carrinho está salvo na conta.</aside>
}
