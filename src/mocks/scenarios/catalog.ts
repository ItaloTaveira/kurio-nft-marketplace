export const catalogScenarios = ['success', 'empty', 'slow', 'error', 'offline', 'out-of-order'] as const
export type CatalogScenario = typeof catalogScenarios[number]
export const scenarioStorageKey = 'kurio:catalog-scenario'

export function getCatalogScenario(): CatalogScenario {
  const value = localStorage.getItem(scenarioStorageKey)
  return catalogScenarios.find(scenario => scenario === value) ?? 'success'
}
