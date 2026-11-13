export const cartScenarios = ['success', 'seeded', 'slow', 'error', 'offline', 'mutation-error', 'price-changed', 'stock-reduced', 'sold-out', 'coupon-expired'] as const
export const cartScenarioKey = 'kurio:cart-scenario'
export function getCartScenario() {
  const value = localStorage.getItem(cartScenarioKey)
  return cartScenarios.find(scenario => scenario === value) ?? 'success'
}
