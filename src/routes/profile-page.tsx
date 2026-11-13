import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, type Profile, type ProfileUpdate } from '@/shared/contracts/account'
import { useAccountCommands, useAccountResource } from '@/features/account/queries'
import { AccountFailure, AccountLayout, AccountLoading } from '@/features/account/components/account-layout'
import { getSessionToken, useSessionToken } from '@/shared/api/session-token'
import { apiErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import hide from '@/shared/assets/figma/account-imgHide.svg'
import imageIcon from '@/shared/assets/figma/account-imgImage2.svg'

export function ProfilePage() {
  const { profile, pending } = useAccountResource('profile')
  const token = useSessionToken()
  return <AccountLayout active="profile">{profile.isPending && <AccountLoading label="Carregando perfil" />}{profile.isError && <AccountFailure retry={() => void profile.refetch()} />}{profile.data && <ProfileForm key={token} profile={profile.data} pending={pending} />}</AccountLayout>
}
function formValues(profile: Profile): ProfileUpdate { return { ...profile, currentPassword: '', newPassword: '', confirmPassword: '' } }
function ProfileForm({ profile, pending }: { profile: Profile; pending: boolean }) {
  const initial = useMemo(() => formValues(profile), [profile])
  const version = useRef(profile.version)
  const [feedback, setFeedback] = useState('')
  const [fileError, setFileError] = useState('')
  const [readingFile, setReadingFile] = useState(false)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const commands = useAccountCommands()
  const { register, handleSubmit, reset, setValue, control, formState: { errors, isDirty, isSubmitting } } = useForm<ProfileUpdate>({ resolver: zodResolver(profileUpdateSchema), defaultValues: initial })
  const avatar = useWatch({ control, name: 'avatar' })
  useEffect(() => { if (!isDirty) { reset(initial); version.current = profile.version } }, [initial, isDirty, reset, profile.version])
  const submit = async (values: ProfileUpdate) => {
    const actor = getSessionToken()
    setFeedback('')
    try {
      const result = await commands.mutateAsync({ type: 'profile', values, version: version.current })
      if (getSessionToken() !== actor || result.type !== 'profile') return
      reset(formValues(result.data)); version.current = result.data.version
      setFeedback(values.newPassword ? 'Perfil e senha atualizados. Outras sessões foram encerradas.' : 'Perfil atualizado com sucesso.')
    } catch { /* A mensagem da API permanece visível e o preenchimento é preservado. */ }
  }
  async function upload(file?: File) {
    if (!file) return
    setFileError(''); setReadingFile(true)
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 200 * 1024) throw new Error('Use PNG, JPEG ou WebP de até 200 KB.')
      const bitmap = await createImageBitmap(file)
      const valid = bitmap.width <= 1024 && bitmap.height <= 1024
      bitmap.close()
      if (!valid) throw new Error('Use uma imagem de até 1024 × 1024 pixels.')
      const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
      setValue('avatar', data, { shouldDirty: true, shouldValidate: true })
    } catch (error) { setFileError(error instanceof Error ? error.message : 'Não foi possível ler a imagem.') }
    finally { setReadingFile(false) }
  }
  const input = (name: keyof ProfileUpdate) => ({ ...register(name), id: `profile-${name}`, 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `profile-${name}-error` : undefined })
  const error = (name: keyof ProfileUpdate) => errors[name] && <p role="alert" id={`profile-${name}-error`} className="account-error">{errors[name]?.message}</p>
  return <><h1>Perfil do colecionador</h1><form noValidate onSubmit={event => { void handleSubmit(submit)(event) }} aria-busy={pending || readingFile}><fieldset disabled={pending || readingFile || isSubmitting}><legend className="sr-only">Dados do perfil</legend><div className="account-fields-grid profile-fields">{[{ name: 'name', label: 'Nome de exibição', type: 'text', autoComplete: 'name' }, { name: 'username', label: 'Nome de usuário', type: 'text', autoComplete: 'username' }, { name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email' }].map(field => <div className="account-field" key={field.name}><label htmlFor={`profile-${field.name}`}>{field.label}<span aria-hidden="true">*</span></label><input {...input(field.name as keyof ProfileUpdate)} type={field.type} autoComplete={field.autoComplete} maxLength={field.name === 'email' ? 254 : field.name === 'username' ? 32 : 40} />{error(field.name as keyof ProfileUpdate)}</div>)}<div className="account-field"><label htmlFor="profile-ens">Nome ENS <small>(opcional)</small></label><div className="account-ens"><span title="Sufixo fixo dos nomes ENS">.eth</span><input {...input('ens')} maxLength={63} placeholder="nome" /></div>{error('ens')}</div><div className="account-field"><label htmlFor="profile-walletAlias">Apelido da carteira <small>(opcional)</small></label><input {...input('walletAlias')} maxLength={40} />{error('walletAlias')}</div><div className="account-field profile-avatar-field"><label htmlFor="profile-avatar-file">Avatar</label><div className="profile-avatar-controls"><span className="profile-avatar">{avatar ? <img src={avatar} alt="Prévia do avatar" className="profile-avatar-image" /> : <img src={imageIcon} alt="Sem avatar" />}</span><label className="account-upload-button" htmlFor="profile-avatar-file">Alterar<input id="profile-avatar-file" type="file" aria-label="Alterar avatar" accept="image/png,image/jpeg,image/webp" onChange={event => { void upload(event.target.files?.[0]); event.target.value = '' }} /></label><button type="button" disabled={!avatar} onClick={() => { setValue('avatar', null, { shouldDirty: true }); setFileError('') }}>Remover</button></div><p className="account-help">PNG, JPEG ou WebP; até 200 KB e 1024 × 1024 px.</p>{(fileError || errors.avatar) && <p role="alert" className="account-error">{fileError || errors.avatar?.message}</p>}</div></div><section className="profile-passwords" aria-labelledby="profile-password-title"><h2 id="profile-password-title">Alterar senha</h2>{[{ name: 'currentPassword', label: 'Senha atual', autoComplete: 'current-password' }, { name: 'newPassword', label: 'Nova senha', autoComplete: 'new-password' }, { name: 'confirmPassword', label: 'Confirmar nova senha', autoComplete: 'new-password' }].map(field => <div className="account-field" key={field.name}><label htmlFor={`profile-${field.name}`}>{field.label}</label><div className="account-password"><input {...input(field.name as keyof ProfileUpdate)} type={visible[field.name] ? 'text' : 'password'} autoComplete={field.autoComplete} maxLength={128} /><button type="button" aria-label={`${visible[field.name] ? 'Ocultar' : 'Mostrar'} ${field.label.toLowerCase()}`} aria-pressed={!!visible[field.name]} onClick={() => setVisible(previous => ({ ...previous, [field.name]: !previous[field.name] }))}><img src={hide} alt="" /></button></div>{error(field.name as keyof ProfileUpdate)}</div>)}</section><Button type="submit" className="account-save" disabled={!!fileError}>{pending ? 'Salvando…' : 'Salvar'}</Button></fieldset>{readingFile && <p role="status" className="account-help">Lendo imagem…</p>}{commands.isError && <div className="account-error" role="alert"><p>{apiErrorMessage(commands.error)}</p><button type="button" className="mt-2 underline" onClick={() => location.reload()}>Recarregar dados salvos</button></div>}<p role="status" className="account-feedback">{feedback}</p></form></>
}
