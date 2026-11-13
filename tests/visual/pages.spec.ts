import { expect, test, type Page } from '@playwright/test'
async function stable(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  for (const image of await page.locator('img:visible').all()) { await image.scrollIntoViewIfNeeded(); await expect(image).toHaveJSProperty('complete', true); expect(await image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0) }
  await page.evaluate(() => scrollTo(0, 0))
}
for (const route of ['home', 'detail', 'cart', 'checkout', 'receipt']) test(`referência visual: ${route}`, async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-13T12:00:00Z'))
  await page.goto('/')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  if (route === 'detail') { await page.goto('/nfts/emerald-ape-042'); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Emerald Ape #042') }
  if (route === 'cart') {
    await page.evaluate(() => localStorage.setItem('kurio:cart-scenario', 'seeded'))
    // A primeira consulta do cabeçalho já pode ter criado o carrinho vazio.
    await page.evaluate(() => localStorage.removeItem('kurio:guest-cart:v1'))
    await page.goto('/carrinho'); await expect(page.getByTestId('cart-item')).toHaveCount(4)
  }
  if (route === 'checkout' || route === 'receipt') {
    await page.evaluate(async () => {
      const auth = await (await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'nova@kurio.test', password: 'Kurio123!' }) })).json()
      sessionStorage.setItem('kurio:session-token', auth.token)
      const headers = { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' }
      await fetch('/api/wallets/primary', { method: 'PUT', headers: { ...headers, 'If-Match': '"0"' }, body: JSON.stringify({ name: 'Nova', alias: 'Principal', profileName: 'Nova', email: 'nova@kurio.test', network: 'ethereum', provider: 'WalletConnect', address: `0x${'a'.repeat(40)}`, secondaryAddress: '', referralCode: '', ens: '' }) })
      await fetch('/api/cart/items', { method: 'POST', headers: { ...headers, 'Idempotency-Key': 'visual-cart-attempt' }, body: JSON.stringify({ nftId: 'emerald-ape-042', editionId: 'limited-50', quantity: 2, expectedUnitPriceEth: '1.19' }) })
    })
    await page.goto('/pagamento')
    await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
    await expect(page.getByText('Carteira conectada · simulação', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Revisar pedido', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Confirmar compra', exact: true })).toBeVisible()
    if (route === 'receipt') {
      await page.getByRole('button', { name: 'Confirmar compra', exact: true }).click()
      await expect(page).toHaveURL(/\/pedidos\//)
      await page.clock.setFixedTime(new Date('2026-11-13T12:00:05Z'))
      await expect(page.getByRole('heading', { name: 'Compra confirmada', exact: true })).toBeVisible()

    }
  }
  await expect(page.getByTestId('realtime-state')).toHaveText('Conectado')
  await stable(page)
  await expect(page).toHaveScreenshot(`${route}.png`, { fullPage: true, animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.003, stylePath: 'tests/visual/screenshot.css', maskColor: '#39281e', mask: route === 'receipt' ? [page.getByTestId('order-id'), page.locator('.order-transaction > p').first()] : [] })
  if (route === 'receipt') {
    await page.getByRole('link', { name: 'Fechar recibo e voltar ao carrinho', exact: true }).click()
    await expect(page).toHaveURL('/carrinho')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio', exact: true })).toBeVisible()
  }
})
