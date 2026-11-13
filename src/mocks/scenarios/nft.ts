export const nftScenarios = ['success', 'slow', 'error', 'offline', 'sold-out', 'stock-reduced'] as const
export const nftScenarioStorageKey = 'kurio:nft-scenario'
export function getNftScenario() {
  const value = localStorage.getItem(nftScenarioStorageKey)
  return nftScenarios.find(scenario => scenario === value) ?? 'success'
}
