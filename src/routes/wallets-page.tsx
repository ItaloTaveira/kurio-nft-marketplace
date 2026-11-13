import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { networks, providers, walletFieldsSchema, type WalletFields, type WalletSlot, type Wallets } from '@/shared/contracts/account'
import { useSession } from '@/features/auth/queries'
import { useAccountCommands, useAccountResource } from '@/features/account/queries'
import { AccountFailure, AccountLayout, AccountLoading } from '@/features/account/components/account-layout'
import { getSessionToken, useSessionToken } from '@/shared/api/session-token'
import { apiErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import arrow from '@/shared/assets/figma/account-imgArrowDown.svg'

export function WalletsPage() {
  const { wallets, pending } = useAccountResource('wallets')
  const token = useSessionToken()
  return <AccountLayout active="wallets">{wallets.isPending && <AccountLoading label="Carregando carteiras" />}{wallets.isError && <AccountFailure retry={() => void wallets.refetch()} />}{wallets.data && <><WalletsEditor key={token} wallets={wallets.data} pending={pending} />{wallets.data.primary && <Button asChild className="mt-8"><Link to="/pagamento">Continuar para pagamento</Link></Button>}</>}</AccountLayout>
}
function WalletsEditor({ wallets, pending }: { wallets: Wallets; pending: boolean }) {
  const commands = useAccountCommands()
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const preference = async (same: boolean) => { try { await commands.mutateAsync({ type: 'preference', same, version: wallets.version }) } catch { /* Mantém a preferência confirmada anteriormente. */ } }
  return <><h1>Carteira principal</h1><p className="wallet-intro">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p><WalletForm slot="primary" wallet={wallets.primary} version={wallets.version} pending={pending} /><section className="wallet-secondary" aria-labelledby="secondary-wallet-title"><div className="wallet-secondary-heading"><h2 id="secondary-wallet-title">Carteira secundária</h2><label><input type="checkbox" checked={wallets.secondarySameAsPrimary} disabled={pending || !wallets.primary} onChange={event => void preference(event.target.checked)} />Igual à carteira principal</label>{!wallets.secondary && !wallets.secondarySameAsPrimary && <button type="button" disabled={pending} onClick={() => setSecondaryOpen(value => !value)}>{secondaryOpen ? 'Cancelar' : 'Adicionar'}</button>}</div>{commands.isError && <p role="alert" className="account-error">{apiErrorMessage(commands.error)}</p>}{wallets.secondarySameAsPrimary ? <p className="account-help">A carteira secundária acompanha a principal: {wallets.primary?.alias}. Uma carteira secundária anterior permanece salva ao desmarcar esta opção.</p> : secondaryOpen || wallets.secondary ? <WalletForm slot="secondary" wallet={wallets.secondary} version={wallets.version} pending={pending} /> : <p className="account-help">Você ainda não adicionou uma carteira secundária.</p>}</section></>
}
function WalletForm({ slot, wallet, version, pending }: { slot: WalletSlot; wallet: WalletFields | null; version: number; pending: boolean }) {
  const session = useSession()
  const defaults = useMemo<WalletFields>(() => wallet ?? ({ name: session.data?.user.name ?? '', alias: slot === 'primary' ? 'Principal' : 'Reserva', network: 'ethereum', profileName: session.data?.user.name ?? '', address: '', secondaryAddress: '', provider: 'WalletConnect', referralCode: '', email: session.data?.user.email ?? '', ens: '' }), [wallet, slot, session.data])
  const baseVersion = useRef(version)
  const [feedback, setFeedback] = useState('')
  const commands = useAccountCommands()
  const { register, handleSubmit, control, reset, formState: { errors, isDirty, isSubmitting } } = useForm<WalletFields>({ resolver: zodResolver(walletFieldsSchema), defaultValues: defaults })
  const network = useWatch({ control, name: 'network' })
  useEffect(() => { if (!isDirty) { reset(defaults); baseVersion.current = version } }, [defaults, version, isDirty, reset])
  const submit = async (values: WalletFields) => {
    const actor = getSessionToken()
    setFeedback('')
    try {
      const response = await commands.mutateAsync({ type: 'wallet', slot, values, version: baseVersion.current })
      if (getSessionToken() !== actor || response.type !== 'wallets') return
      reset(response.data[slot]!); baseVersion.current = response.data.version; setFeedback('Carteira salva com sucesso.')
    } catch { /* Preserva os campos para correção ou nova tentativa. */ }
  }
  const input = (name: keyof WalletFields) => ({ ...register(name), id: `${slot}-${name}`, 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${slot}-${name}-error` : undefined })
  const error = (name: keyof WalletFields) => errors[name] && <p id={`${slot}-${name}-error`} role="alert" className="account-error">{errors[name]?.message}</p>
  const textField = (name: keyof WalletFields, label: string, required = true, type = 'text', placeholder?: string) => <div className="account-field"><label htmlFor={`${slot}-${name}`}>{label}{required ? <span aria-hidden="true">*</span> : <small>(opcional)</small>}</label><input {...input(name)} type={type} placeholder={placeholder} maxLength={name === 'email' ? 254 : name.includes('Address') || name === 'address' ? 128 : 40} />{error(name)}</div>
  return <form noValidate aria-label={slot === 'primary' ? 'Dados da carteira principal' : 'Dados da carteira secundária'} onSubmit={event => { void handleSubmit(submit)(event) }} aria-busy={pending}><fieldset disabled={pending || isSubmitting}><legend className="sr-only">Dados da carteira</legend><div className="account-fields-grid wallet-fields">{textField('name', 'Nome de exibição')}{textField('alias', 'Apelido da carteira')}<div className="account-field"><label htmlFor={`${slot}-network`}>Rede<span aria-hidden="true">*</span></label><select {...input('network')} style={{ backgroundImage: `url("${arrow}")` }}>{networks.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>{error('network')}</div>{textField('profileName', 'Nome do perfil')}{textField('address', 'Endereço da carteira', true, 'text', network === 'solana' ? 'Endereço Solana' : 'Endereço 0x da carteira')}{textField('secondaryAddress', 'ENS ou endereço alternativo', false)}<div className="account-field"><label htmlFor={`${slot}-provider`}>Tipo de carteira<span aria-hidden="true">*</span></label><select {...input('provider')} style={{ backgroundImage: `url("${arrow}")` }}>{providers.map(provider => <option key={provider} value={provider} disabled={network === 'solana' && provider === 'MetaMask'}>{provider}</option>)}</select>{error('provider')}</div>{textField('referralCode', 'Código de indicação', false)}{textField('email', 'E-mail', true, 'email')}<div className="account-field"><label htmlFor={`${slot}-ens`}>Nome ENS <small>(opcional)</small></label><div className="account-ens"><span style={{ backgroundImage: `url("${arrow}")` }}>.eth</span><input {...input('ens')} placeholder="nome" maxLength={63} /></div>{error('ens')}</div></div><Button type="submit" className="account-save wallet-save">{pending ? 'Salvando…' : 'Salvar carteira'}</Button></fieldset>{commands.isError && <div role="alert" className="account-error"><p>{apiErrorMessage(commands.error)}</p><button type="button" className="mt-2 underline" onClick={() => location.reload()}>Recarregar dados salvos</button></div>}<p className="account-feedback" role="status">{feedback}</p></form>
}
