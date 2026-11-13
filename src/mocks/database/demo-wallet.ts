import type { WalletFields } from '@/shared/contracts/account'

export function demoWalletAddress(network: WalletFields['network']) {
  const bytes = crypto.getRandomValues(new Uint8Array(network === 'solana' ? 32 : 20))
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  if (network !== 'solana') return `0x${hex}`
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let value = BigInt(`0x${hex}`)
  let address = ''
  while (value > 0n) { address = alphabet[Number(value % 58n)] + address; value /= 58n }
  for (const byte of bytes) { if (byte !== 0) break; address = `1${address}` }
  return address
}
