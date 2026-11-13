import { http } from '@/shared/api/http'
import { demoWalletAddressSchema, profileSchema, walletsSchema, type ProfileUpdate, type WalletFields, type WalletSlot } from '@/shared/contracts/account'
const headers = (token: string, version?: number) => ({ Authorization: `Bearer ${token}`, ...(version === undefined ? {} : { 'If-Match': `"${version}"` }) })
export async function getProfile(token: string, signal: AbortSignal) { return profileSchema.parse((await http.get('/profile', { signal, headers: headers(token) })).data) }
export async function getWallets(token: string, signal: AbortSignal) { return walletsSchema.parse((await http.get('/wallets', { signal, headers: headers(token) })).data) }
export type AccountAction =
  | { type: 'profile'; values: ProfileUpdate; version: number }
  | { type: 'wallet'; slot: WalletSlot; values: WalletFields; version: number }
  | { type: 'preference'; same: boolean; version: number }
export async function changeAccount(token: string, action: AccountAction) {
  const config = { headers: headers(token, action.version) }
  if (action.type === 'profile') return { type: 'profile' as const, data: profileSchema.parse((await http.patch('/profile', action.values, config)).data) }
  const response = action.type === 'wallet' ? await http.put(`/wallets/${action.slot}`, action.values, config) : await http.patch('/wallets/preferences', { secondarySameAsPrimary: action.same }, config)
  return { type: 'wallets' as const, data: walletsSchema.parse(response.data) }
}

export async function generateDemoWalletAddress(token: string, network: WalletFields['network']) { return demoWalletAddressSchema.parse((await http.post('/wallets/demo-address', { network }, { headers: headers(token) })).data) }
