import Decimal from 'decimal.js'

// Nunca converte o valor monetário completo para ponto flutuante.
export function formatEth(value: string) {
  return `${new Decimal(value).toFixed()} ETH`
}
