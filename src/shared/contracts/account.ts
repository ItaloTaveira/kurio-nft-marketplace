import { z } from 'zod'
import { registerSchema } from './auth'

const optionalName = z.string().trim().max(40, 'Use até 40 caracteres.')
export const ensSchema = z.string().trim().toLowerCase().max(63).refine(value => !value || /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value), 'Informe apenas o nome, sem .eth, usando letras, números e hífen.')
export const avatarSchema = z.string().max(280000, 'A imagem deve ter até 200 KB.').regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Use uma imagem PNG, JPEG ou WebP.').nullable()
export const profileFieldsSchema = z.object({
  name: registerSchema.shape.name,
  username: z.string().trim().toLowerCase().min(3, 'Use pelo menos 3 caracteres.').max(32, 'Use até 32 caracteres.').regex(/^[a-z0-9_.-]+$/, 'Use letras, números, ponto, hífen ou sublinhado.'),
  email: registerSchema.shape.email, ens: ensSchema, walletAlias: optionalName, avatar: avatarSchema,
})
export const passwordFieldsSchema = z.object({ currentPassword: z.string().max(128), newPassword: z.string().max(128), confirmPassword: z.string().max(128) })
export const profileUpdateSchema = profileFieldsSchema.extend(passwordFieldsSchema.shape).superRefine((value, context) => {
  if (value.currentPassword || value.newPassword || value.confirmPassword) {
    if (!value.currentPassword) context.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Informe sua senha atual.' })
    if (value.newPassword.length < 8) context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Use pelo menos 8 caracteres.' })
    if (value.newPassword === value.currentPassword) context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Escolha uma senha diferente da atual.' })
    if (value.newPassword !== value.confirmPassword) context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas precisam ser iguais.' })
  }
})
export const profileSchema = profileFieldsSchema.extend({ id: z.string(), version: z.number().int().nonnegative() })
export type Profile = z.infer<typeof profileSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>

export const networks = [{ id: 'ethereum', label: 'Ethereum' }, { id: 'polygon', label: 'Polygon' }, { id: 'solana', label: 'Solana' }] as const
export const providers = ['WalletConnect', 'MetaMask', 'Coinbase Wallet'] as const
const addressValid = (address: string, network: string) => network === 'solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) : /^0x[0-9a-fA-F]{40}$/.test(address)
export const walletFieldsSchema = z.object({
  name: registerSchema.shape.name, alias: z.string().trim().min(2, 'Use pelo menos 2 caracteres.').max(40),
  network: z.enum(['ethereum', 'polygon', 'solana'], { error: 'Selecione uma rede.' }),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.').max(40),
  address: z.string().trim().max(128), secondaryAddress: z.string().trim().max(128),
  provider: z.enum(providers, { error: 'Selecione um tipo de carteira.' }), referralCode: z.string().trim().max(32),
  email: registerSchema.shape.email, ens: ensSchema,
}).superRefine((value, context) => {
  if (!addressValid(value.address, value.network)) context.addIssue({ code: 'custom', path: ['address'], message: value.network === 'solana' ? 'Informe um endereço Solana de 32 a 44 caracteres Base58.' : 'Informe 0x seguido de 40 caracteres hexadecimais.' })
  if (value.secondaryAddress && !addressValid(value.secondaryAddress, value.network) && !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.eth$/.test(value.secondaryAddress)) context.addIssue({ code: 'custom', path: ['secondaryAddress'], message: 'Informe um endereço válido para a rede ou um nome .eth.' })
  if (value.network === 'solana' && value.provider === 'MetaMask') context.addIssue({ code: 'custom', path: ['provider'], message: 'Use WalletConnect ou Coinbase Wallet para Solana nesta simulação.' })
})
export type WalletFields = z.infer<typeof walletFieldsSchema>
export const walletsSchema = z.object({ version: z.number().int().nonnegative(), primary: walletFieldsSchema.nullable(), secondary: walletFieldsSchema.nullable(), secondarySameAsPrimary: z.boolean() })
export type Wallets = z.infer<typeof walletsSchema>
export type WalletSlot = 'primary' | 'secondary'
export const walletPreferencesSchema = z.object({ secondarySameAsPrimary: z.boolean() })

export const demoWalletInputSchema = z.object({ network: z.enum(['ethereum', 'polygon', 'solana']) })
export const demoWalletAddressSchema = demoWalletInputSchema.extend({ address: z.string().min(1).max(128) })
