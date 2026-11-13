import Decimal from 'decimal.js'
import type { Nft } from '@/shared/contracts/catalog'

// Valores fictícios expressos em ETH equivalente, a moeda de cotação da API.
export function networkFee(network: Nft['network']) {
  const normal = { ethereum: '0.016', polygon: '0.003', solana: '0.001' }[network]
  return localStorage.getItem('kurio:checkout-scenario') === 'fee-changed' ? new Decimal(normal).mul('1.5').toFixed() : normal
}
