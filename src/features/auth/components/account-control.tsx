import './account-control.css'
import { Link, useLocation } from '@tanstack/react-router'
import { useIsMutating } from '@tanstack/react-query'
import { useSession, useLogout } from '../queries'
import { useSessionToken } from '@/shared/api/session-token'
import { apiErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import loginIcon from '@/shared/assets/figma/login.svg'

export function AccountControl() {
  const token = useSessionToken()
  const session = useSession()
  const logout = useLogout()
  const location = useLocation()
  const cartPending = useIsMutating({ mutationKey: ['cart-mutation'] }) + useIsMutating({ mutationKey: ['account-mutation'] }) + useIsMutating({ mutationKey: ['checkout-mutation'] }) > 0
  if (token && (session.isPending || session.isError)) return <Button className="account-control" disabled={session.isPending} onClick={() => void session.refetch()}>{session.isError ? 'Tentar sessão' : 'Carregando…'}</Button>
  if (!session.data) return <Button asChild className="account-control"><Link to="/entrar" search={{ returnTo: `${location.pathname}${location.searchStr}${location.hash ? `#${location.hash}` : ''}` }}><img src={loginIcon} alt="" /><span>Entrar</span></Link></Button>
  return <div className="account-menu"><details><summary aria-label={`Conta de ${session.data.user.name}`}>{session.data.user.name}</summary><div className="account-menu-panel"><p>{session.data.user.email}</p><nav className="mb-4 flex flex-col gap-3"><Link onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')} to="/perfil">Meu perfil</Link><Link onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')} to="/carteiras">Minhas carteiras</Link><Link onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')} to="/favoritos">Lista de interesse</Link></nav><Button disabled={logout.isPending || cartPending} onClick={() => logout.mutate()}>{logout.isPending ? 'Saindo…' : 'Sair'}</Button>{logout.isError && <p role="alert">{apiErrorMessage(logout.error, 'Não foi possível sair. Tente novamente.')}</p>}</div></details></div>
}
