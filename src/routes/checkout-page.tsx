import { useAccountResource } from '@/features/account/queries'
import Decimal from 'decimal.js'
import { networkLabels } from '@/shared/contracts/catalog'
import { defaultCatalogSearch } from '@/shared/contracts/catalog'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { checkoutSelectionSchema, type CheckoutContext, type CheckoutQuote, type CheckoutSelection } from '@/shared/contracts/checkout'
import { networks, providers } from '@/shared/contracts/account'
import { useSession } from '@/features/auth/queries'
import { useSessionToken, getSessionToken } from '@/shared/api/session-token'
import { apiErrorMessage } from '@/shared/api/errors'
import { formatEth } from '@/shared/lib/eth'
import { Button } from '@/shared/ui/button'
import { useCheckout, useCheckoutCommands, usePreviousAttempt, useNetworkFee } from '@/features/checkout/queries'
import { CheckoutLayout, CheckoutLoading } from '@/features/checkout/components/checkout-layout'
import { OrderSummary } from '@/features/checkout/components/order-summary'
import { clearAttempt, readAttempt, readDraft, saveAttempt, saveDraft, type CheckoutAttempt } from '@/features/checkout/persistence'

export function CheckoutPage() {
  const query = useCheckout()
  const token = useSessionToken()
  const session = useSession()
  return <CheckoutLayout title="Pagamento com carteira">{query.isPending && <CheckoutLoading label="Carregando pagamento" />}{query.isError && <div role="alert" className="checkout-notice"><p>Não foi possível consultar o pagamento. Seus itens e pedidos continuam salvos.</p><Button className="mt-4" onClick={() => void query.refetch()}>Tentar novamente</Button></div>}{query.data && session.data && <CheckoutEditor key={token} owner={session.data.user.id} context={query.data} pending={query.pending} />}</CheckoutLayout>
}
function CheckoutEditor({ owner, context, pending }: { owner: string; context: CheckoutContext; pending: boolean }) {
  const profileQuery = useAccountResource('profile').profile
  const navigate = useNavigate()
  const commands = useCheckoutCommands()
  const [collectorOpen, setCollectorOpen] = useState(() => window.matchMedia('(min-width:1024px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(min-width:1024px)')
    const update = () => setCollectorOpen(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const [review, setReview] = useState<CheckoutQuote | null>(null)
  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(() => readAttempt(owner))
  const [feedback, setFeedback] = useState('')
  const [localError, setLocalError] = useState('')
  const inFlight = useRef(false)
  const defaults: CheckoutSelection = readDraft(owner) ?? { name: context.collector.name, email: context.collector.email, walletSlot: context.connection?.walletSlot ?? 'primary', network: context.connection?.network ?? context.wallets.primary?.network ?? 'ethereum', provider: context.connection?.provider ?? context.wallets.primary?.provider ?? 'WalletConnect' }
  const { register, handleSubmit, control, setValue, getValues, formState: { errors, isSubmitting } } = useForm<CheckoutSelection>({ resolver: zodResolver(checkoutSelectionSchema), defaultValues: { ...defaults, notes: defaults.notes ?? '' } })
  const values = useWatch({ control })
  // Um rascunho pode ter sido criado antes de cadastrar ou editar a carteira.
  // Reconcilia só quando a versão das carteiras muda, preservando dados pessoais.
  useEffect(() => {
    if (attempt) return
    const slot = getValues('walletSlot')
    const wallet = slot === 'secondary' && context.wallets.secondarySameAsPrimary ? context.wallets.primary : context.wallets[slot]
    if (wallet) {
      setValue('network', wallet.network)
      setValue('provider', wallet.provider)
      try { saveDraft(owner, getValues()) } catch { /* O formulário permanece utilizável sem persistência. */ }
    }
  }, [context.wallets, owner, getValues, setValue, attempt])

  const fee = useNetworkFee(values.network ?? 'ethereum')
  const incompatible = context.cart.items.filter(item => item.network !== values.network)
  const recovery = usePreviousAttempt(attempt, pending || isSubmitting)
  const selectedWallet = values.walletSlot === 'secondary' && context.wallets.secondarySameAsPrimary ? context.wallets.primary : context.wallets[values.walletSlot ?? 'primary']
  const connected = !!context.connection && context.connection.walletSlot === values.walletSlot && context.connection.network === values.network && context.connection.provider === values.provider && context.connection.address === selectedWallet?.address && context.connection.alias === selectedWallet?.alias
  const validReview = review && connected && review.connectionId === context.connection?.id && JSON.stringify(review.selection) === JSON.stringify(checkoutSelectionSchema.safeParse(values).data) ? review : null
  const locked = pending || isSubmitting || !!attempt
  useEffect(() => {
    const id = recovery.data?.id ?? (!attempt ? context.pendingOrderId : null)
    if (id) void navigate({ to: '/pedidos/$orderId', params: { orderId: id }, replace: true })
  }, [recovery.data?.id, context.pendingOrderId, attempt, navigate])
  const remember = () => { try { saveDraft(owner, getValues()) } catch { setLocalError('Não foi possível guardar o preenchimento nesta aba. Verifique o armazenamento do navegador.') } }
  async function connect(values: CheckoutSelection) {
    if (inFlight.current) return
    inFlight.current = true; setLocalError(''); setFeedback('')
    try { await commands.mutateAsync({ type: 'connect', input: values }); setReview(null); setFeedback('Carteira conectada na simulação. Revise o pedido para continuar.') }
    catch { /* Feedback da API é exibido abaixo. */ }
    finally { inFlight.current = false }
  }
  async function revise(values: CheckoutSelection) {
    if (!context.connection || inFlight.current) return
    inFlight.current = true; setLocalError(''); setFeedback('')
    try { const result = await commands.mutateAsync({ type: 'quote', input: { ...values, connectionId: context.connection.id } }); if (result.type === 'quote') { setReview(result.data); setFeedback('Pedido revisado. Confira os dados e confirme a compra.') } }
    catch { setReview(null) }
    finally { inFlight.current = false }
  }
  async function disconnect() {
    if (!context.connection || inFlight.current) return
    inFlight.current = true; setFeedback('')
    try { await commands.mutateAsync({ type: 'disconnect', id: context.connection.id }); setReview(null); setFeedback('Carteira desconectada.') }
    catch { /* A conexão anterior permanece visível até nova consulta. */ }
    finally { inFlight.current = false }
  }
  async function submit(existing?: CheckoutAttempt) {
    const quote = existing?.quote ?? validReview
    if (!quote || inFlight.current) return
    inFlight.current = true; setLocalError(''); setFeedback('')
    const actor = getSessionToken()
    try {
      const current = saveAttempt(owner, quote, existing?.key)
      setAttempt(current)
      const result = await commands.mutateAsync({ type: 'submit', quoteId: current.quote.id, key: current.key })
      if (actor === getSessionToken() && result.type === 'order') await navigate({ to: '/pedidos/$orderId', params: { orderId: result.data.id } })
    } catch (error) {
      if (isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 401) { clearAttempt(owner); setAttempt(null); setReview(null) }
      if (!isAxiosError(error)) setLocalError('Não foi possível registrar a tentativa neste navegador. Nenhum novo envio será feito sem essa identificação.')
    } finally { inFlight.current = false }
  }
  const chooseWallet = (slot: 'primary' | 'secondary') => {
    const wallet = slot === 'secondary' && context.wallets.secondarySameAsPrimary ? context.wallets.primary : context.wallets[slot]
    setValue('walletSlot', slot); if (wallet) { setValue('network', wallet.network); setValue('provider', wallet.provider) }
    remember()
  }
  const canEdit = context.cart.items.length > 0
  return <>{context.pendingOrderId && !attempt && <p role="status">Recuperando seu pedido pendente…</p>}{!canEdit && !attempt && !context.pendingOrderId ? <section className="checkout-notice"><h2>Seu carrinho está vazio</h2><p>Escolha uma arte antes de iniciar o pagamento.</p><Button asChild className="mt-4"><Link to="/" search={defaultCatalogSearch}>Explorar NFTs</Link></Button></section> : <div className="checkout-grid"><div><details className="checkout-collector-panel" open={collectorOpen} onToggle={event => setCollectorOpen(event.currentTarget.open)}><summary>Dados do colecionador</summary><form id="checkout-form" noValidate onChange={remember} onSubmit={event => { event.preventDefault(); void handleSubmit(connected ? revise : connect, () => setCollectorOpen(true))(event) }} aria-busy={pending}><fieldset disabled={locked}><legend>Perfil do colecionador</legend><div className="account-fields-grid checkout-form-fields"><div className="account-field"><label htmlFor="checkout-name">Nome de exibição</label><input id="checkout-name" {...register('name')} autoComplete="name" maxLength={40} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'checkout-name-error' : undefined} />{errors.name && <p role="alert" id="checkout-name-error" className="account-error">{errors.name.message}</p>}</div><div className="account-field"><label htmlFor="checkout-username">Nome de usuário</label><input id="checkout-username" readOnly value={profileQuery.data?.username ?? ''} /></div><div className="account-field"><label htmlFor="checkout-network">Rede</label><select id="checkout-network" {...register('network')}>{networks.map(network => <option key={network.id} value={network.id}>{network.label}</option>)}</select></div><div className="account-field"><label htmlFor="checkout-profile-name">Nome do perfil</label><input id="checkout-profile-name" readOnly value={selectedWallet?.profileName ?? ''} placeholder="Cadastre uma carteira" /></div><div className="account-field"><label htmlFor="checkout-address">Endereço da carteira</label><input id="checkout-address" readOnly value={selectedWallet?.address ?? ''} placeholder="Endereço da carteira cadastrada" /></div><div className="account-field"><label htmlFor="checkout-secondary">ENS ou carteira secundária <small>(opcional)</small></label><input id="checkout-secondary" readOnly value={selectedWallet?.secondaryAddress ?? ''} /></div><div className="account-field"><label htmlFor="checkout-provider">Carteira e provedor</label><select id="checkout-provider" {...register('provider')}>{providers.map(provider => <option key={provider}>{provider}</option>)}</select></div><div className="account-field"><label htmlFor="checkout-referral">Código de indicação <small>(opcional)</small></label><input id="checkout-referral" readOnly value={selectedWallet?.referralCode ?? ''} /></div><div className="account-field"><label htmlFor="checkout-email">E-mail</label><input id="checkout-email" {...register('email')} type="email" autoComplete="email" maxLength={254} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'checkout-email-error' : undefined} />{errors.email && <p role="alert" id="checkout-email-error" className="account-error">{errors.email.message}</p>}</div><div className="account-field"><label htmlFor="checkout-ens">Nome ENS <small>(opcional)</small></label><div className="account-ens"><span>.eth</span><input id="checkout-ens" readOnly value={selectedWallet?.ens ?? profileQuery.data?.ens ?? ''} /></div></div><div className="account-field"><label htmlFor="checkout-notes">Observação do colecionador <small>(opcional)</small></label><textarea id="checkout-notes" aria-invalid={!!errors.notes} aria-describedby={errors.notes ? 'checkout-notes-error' : undefined} maxLength={1000} {...register('notes')} rows={5} />{errors.notes && <p role="alert" id="checkout-notes-error" className="account-error">{errors.notes.message}</p>}</div></div>{incompatible.length > 0 && <p role="status" className="checkout-notice">A carteira está em {networkLabels[values.network ?? 'ethereum']}. {incompatible.map(item => `${item.name} (${networkLabels[item.network]})`).join(', ')} precisa de outra rede. Escolha uma carteira compatível ou ajuste os itens no carrinho; remover e adicionar o mesmo NFT não altera sua rede.</p>}<p className="account-help">Altere os dados salvos em <Link to="/perfil" className="underline">Meu perfil</Link> ou <Link to="/carteiras" className="underline">Minhas carteiras</Link>.</p></fieldset></form></details>{commands.isError && <p role="alert" className="checkout-notice">{apiErrorMessage(commands.error)}</p>}{localError && <p role="alert" className="checkout-notice">{localError}</p>}<p role="status" className="account-feedback">{feedback}</p>{attempt && <section className="checkout-notice" aria-label="Recuperação da tentativa"><h2>Verificando sua tentativa anterior</h2><p>Consulte o pedido antes de iniciar outra compra. O reenvio mantém a mesma identificação.</p>{recovery.isFetching && <p role="status">Consultando pedido…</p>}{recovery.isError && <><p>{isAxiosError(recovery.error) && recovery.error.response?.status === 404 ? 'A API ainda não encontrou um pedido para esta tentativa.' : 'Não foi possível consultar a tentativa agora.'}</p><div className="checkout-actions"><Button disabled={pending || recovery.isFetching} onClick={() => void recovery.refetch()}>Consultar tentativa</Button><Button disabled={pending || recovery.isFetching} onClick={() => void submit(attempt)}>Reenviar a mesma tentativa</Button></div></>}</section>}</div><aside>{attempt ? <OrderSummary snapshot={attempt.quote.snapshot} title="Pedido enviado para processamento" /> : validReview ? <><OrderSummary snapshot={validReview.snapshot} title="Revise antes de confirmar" /><div className="checkout-reviewed-data"><p>{validReview.snapshot.collector.name} · {validReview.snapshot.collector.email}</p><p>{validReview.snapshot.wallet.alias} · {validReview.snapshot.wallet.provider}</p><p>{validReview.snapshot.wallet.address}</p></div></> : <><OrderSummary title="Seus NFTs" snapshot={{ items: context.cart.items, subtotalEth: context.cart.quote.subtotalEth, discountEth: context.cart.quote.discountEth, networkFeeEth: fee.data?.networkFeeEth ?? context.cart.quote.networkFeeEth, totalEth: fee.data ? new Decimal(context.cart.quote.subtotalEth).minus(context.cart.quote.discountEth).add(fee.data.networkFeeEth).toFixed() : context.cart.quote.totalEth, coupon: context.cart.quote.coupon?.code ?? null }} />{fee.isPending ? <p role="status">Consultando taxa da rede…</p> : fee.isError ? <p role="alert">Não foi possível estimar a taxa. <button type="button" onClick={() => void fee.refetch()} className="underline">Tentar novamente</button></p> : <p className="account-help">Taxa estimada · {networkLabels[values.network ?? 'ethereum']}: <output aria-label="Taxa estimada da rede">{formatEth(fee.data.networkFeeEth)}</output>. Valores em ETH equivalente na simulação.</p>}</>}{review && !validReview && !attempt && <p className="account-help">A seleção mudou. Revise o pedido novamente.</p>}<section className="checkout-wallet-selection" aria-label="Seleção da carteira"><h2 className="checkout-section-title">Escolha uma carteira</h2><div className="checkout-wallets">{(['primary', 'secondary'] as const).map(slot => { const wallet = slot === 'secondary' && context.wallets.secondarySameAsPrimary ? context.wallets.primary : context.wallets[slot]; return <label key={slot} className={values.walletSlot === slot ? 'checkout-wallet-selected' : ''}><input type="radio" name="walletSlot" value={slot} checked={values.walletSlot === slot} disabled={!wallet || locked} onChange={() => chooseWallet(slot)} /><span><strong>{slot === 'primary' ? 'Principal' : 'Secundária'}{wallet ? ` · ${wallet.alias}` : ''}</strong><small>{wallet ? wallet.address : 'Nenhuma carteira cadastrada'}</small><small>{wallet ? networks.find(network => network.id === wallet.network)?.label : ''}</small></span></label> })}</div><p className="account-help"><Link to="/carteiras" className="text-accent underline">Cadastrar ou editar carteiras</Link></p><div className="checkout-connection"><p>{connected ? 'Carteira conectada · simulação' : 'Carteira desconectada'}</p>{connected ? <button type="button" onClick={() => void disconnect()} className="text-accent underline">Desconectar</button> : <Button type="submit" form="checkout-form" disabled={!selectedWallet || pending}>Conectar carteira</Button>}</div>{context.cart.quote.issues.length > 0 && <div className="checkout-notice"><h2>Revise o carrinho</h2><ul>{context.cart.quote.issues.map((issue, index) => <li key={index}>{issue.message}</li>)}</ul><Link to="/carrinho" className="text-accent underline">Corrigir itens e valores no carrinho</Link></div>}{connected && <Button type="submit" form="checkout-form" disabled={pending || !context.cart.quote.canCheckout} className="checkout-review">{pending ? 'Consultando…' : 'Revisar pedido'}</Button>}</section>{validReview && !attempt && <><Button className="checkout-confirm" disabled={pending || !connected} onClick={() => void submit()}>Confirmar compra</Button><p className="account-help">Revisão válida por 5 minutos. Nenhum pagamento real será realizado.</p></>}<Link to="/carrinho" className="checkout-back">Voltar ao carrinho</Link></aside></div>}</>
}
