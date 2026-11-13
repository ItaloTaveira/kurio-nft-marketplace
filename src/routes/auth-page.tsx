import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useIsMutating } from '@tanstack/react-query'
import { Dialog } from 'radix-ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authFormSchema, safeAuthReturn, isPrivatePath, type RegisterInput } from '@/shared/contracts/auth'
import { defaultCatalogSearch } from '@/shared/contracts/catalog'
import { SiteHeader } from '@/shared/components/site-header'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { Catalog } from '@/features/catalog/components/catalog'
import { useAuthenticate, useSession } from '@/features/auth/queries'
import { useSessionToken } from '@/shared/api/session-token'
import { apiErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import desktopHide from '@/shared/assets/figma/auth-desktop-imgHide.svg'
import hide from '@/shared/assets/figma/auth-imgHide.svg'
import back from '@/shared/assets/figma/detail-back.svg'
import close from '@/shared/assets/figma/auth-imgX.svg'
import '@/features/auth/components/auth.css'

function useDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => { const query = window.matchMedia('(min-width: 1024px)'); const update = () => setDesktop(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update) }, [])
  return desktop
}
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const search = useSearch({ strict: false })
  const returnTo = safeAuthReturn(search.returnTo)
  const navigate = useNavigate()
  const desktop = useDesktop()
  const session = useSession()
  const token = useSessionToken()
  const leave = () => {
    const destination = isPrivatePath(new URL(returnTo, location.origin).pathname) ? '/carrinho' : returnTo
    void navigate({ href: destination, replace: true })
  }
  // O formulário não é mostrado novamente para uma sessão válida.
  useEffect(() => { if (token && session.data) void navigate({ href: returnTo, replace: true }) }, [token, session.data, returnTo, navigate])
  if (desktop) return <><div aria-hidden="true" inert><SiteHeader /><main className="page-container mt-8"><HomeHero /><Catalog search={defaultCatalogSearch} onChange={() => undefined} onReset={() => undefined} filtersOpen={false} onFiltersOpenChange={() => undefined} /></main></div><Dialog.Root open onOpenChange={open => { if (!open) leave() }}><Dialog.Portal><Dialog.Overlay className="auth-overlay" /><Dialog.Content className={`auth-panel auth-${mode}`} onCloseAutoFocus={event => { event.preventDefault(); window.setTimeout(() => document.querySelector<HTMLElement>('[id="conteudo"], main')?.focus(), 0) }}><Dialog.Title className="sr-only">{mode === 'login' ? 'Entrar' : 'Criar conta'}</Dialog.Title><Dialog.Description className="sr-only">Acesse sua conta de colecionador.</Dialog.Description><Dialog.Close className="auth-close" aria-label="Fechar e voltar"><img src={close} alt="" /></Dialog.Close><AuthForm key={mode} mode={mode} returnTo={returnTo} expired={!!search.expired} desktop /></Dialog.Content></Dialog.Portal></Dialog.Root></>
  return <main id="conteudo" tabIndex={-1} className="auth-mobile"><button type="button" className="auth-mobile-back" onClick={leave} aria-label="Voltar e cancelar acesso"><img src={back} alt="" />Voltar</button><Link to="/" search={defaultCatalogSearch} className="auth-wordmark" aria-label="Kurio — início">KURIO</Link><AuthForm key={mode} mode={mode} returnTo={returnTo} expired={!!search.expired} desktop={false} /></main>
}
function AuthForm({ mode, returnTo, expired, desktop }: { mode: 'login' | 'register'; returnTo: string; expired: boolean; desktop: boolean }) {
  const registerMode = mode === 'register'
  const mutation = useAuthenticate()
  const navigate = useNavigate()
  const inFlight = useRef(false)
  const cartPending = useIsMutating({ mutationKey: ['cart-mutation'] }) > 0
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({ resolver: zodResolver(authFormSchema(registerMode)), defaultValues: { name: '', email: '', password: '', confirmPassword: '' } })
  async function onValid(values: RegisterInput) {
    if (inFlight.current || cartPending) return
    inFlight.current = true
    try {
      await mutation.mutateAsync(registerMode ? { mode: 'register', values } : { mode: 'login', values })
      await navigate({ href: returnTo, replace: true })
    } catch { /* A mutation apresenta a mensagem enviada pela API. */ }
    finally { inFlight.current = false }
  }
  const fieldError = (name: keyof RegisterInput) => errors[name] && <p id={`auth-${name}-error`} className="auth-field-error" role="alert">{errors[name]?.message}</p>
  const inputProps = (name: keyof RegisterInput) => ({ ...register(name), id: `auth-${name}`, 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `auth-${name}-error` : undefined })
  return <><div className="auth-heading">{desktop ? <nav aria-label="Acesso à conta"><Link to="/entrar" search={{ returnTo }} aria-current={!registerMode ? 'page' : undefined}>Entrar</Link><span aria-hidden="true" /><Link to="/cadastro" search={{ returnTo }} aria-current={registerMode ? 'page' : undefined}>Criar conta</Link></nav> : <h1>{registerMode ? 'Criar perfil de colecionador' : 'Entrar'}</h1>}{desktop && <p>{registerMode ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.' : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}</p>}</div><form noValidate onSubmit={event => { void handleSubmit(onValid)(event) }} className="auth-form" aria-busy={mutation.isPending}><fieldset disabled={mutation.isPending || cartPending}><legend className="sr-only">{registerMode ? 'Dados do cadastro' : 'Dados de acesso'}</legend>{registerMode && <div className="auth-field"><label htmlFor="auth-name" className="sr-only">Nome de usuário</label><input {...inputProps('name')} placeholder="Nome de usuário" autoComplete="nickname" maxLength={40} />{fieldError('name')}</div>}<div className="auth-field"><label htmlFor="auth-email" className="sr-only">E-mail</label><input {...inputProps('email')} type="email" placeholder={registerMode ? 'Digite seu e-mail' : 'contato@email.com'} autoComplete="email" maxLength={254} />{fieldError('email')}</div><div className="auth-field"><label htmlFor="auth-password" className="sr-only">Senha</label><div className="auth-password"><input {...inputProps('password')} type={showPassword ? 'text' : 'password'} placeholder="Senha" autoComplete={registerMode ? 'new-password' : 'current-password'} maxLength={128} /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}><picture><source media="(min-width: 1024px)" srcSet={desktopHide} /><img src={hide} alt="" /></picture></button></div>{fieldError('password')}</div>{registerMode && <div className="auth-field"><label htmlFor="auth-confirmPassword" className="sr-only">Confirmar senha</label><div className="auth-password"><input {...inputProps('confirmPassword')} type={showConfirm ? 'text' : 'password'} placeholder="Confirmar senha" autoComplete="new-password" maxLength={128} /><button type="button" aria-label={showConfirm ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'} aria-pressed={showConfirm} onClick={() => setShowConfirm(value => !value)}><picture><source media="(min-width: 1024px)" srcSet={desktopHide} /><img src={hide} alt="" /></picture></button></div>{fieldError('confirmPassword')}</div>}{expired && <p className="auth-feedback" role="status">Sua sessão expirou. Entre novamente para retomar.</p>}{mutation.isError && <p className="auth-feedback" role="alert">{apiErrorMessage(mutation.error, 'Não foi possível acessar sua conta. Tente novamente.')}</p>}{cartPending && <p role="status" className="auth-feedback">Aguarde a atualização do carrinho.</p>}<Button type="submit" className="auth-submit">{mutation.isPending ? (registerMode ? 'Criando conta…' : 'Entrando…') : registerMode ? (desktop ? 'Criar conta' : 'Criar perfil') : 'Entrar'}</Button></fieldset></form><p className="auth-switch">{registerMode ? <>Já tem uma conta? <Link to="/entrar" search={{ returnTo }}>Entre</Link></> : <>Novo na Kurio? <Link to="/cadastro" search={{ returnTo }}>Crie uma conta</Link></>}</p></>
}
