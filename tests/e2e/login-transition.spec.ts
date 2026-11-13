import { test, expect } from '@playwright/test'

test('abrir e fechar login mantém a página de fundo e os filtros sem recarregar', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'Mobile usa uma tela de acesso própria')
  let documents = 0
  page.on('request', request => { if (request.resourceType() === 'document') documents += 1 })
  await page.goto('/?q=Golden')
  await expect(page.getByTestId('nft-card').first()).toBeVisible()
  const hero = await page.locator('#hero-title').elementHandle()
  const firstName = await page.getByTestId('nft-card').first().locator('h3').innerText()
  await page.getByRole('link', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await hero!.evaluate(node => node.isConnected)).toBe(true)
  await expect(page.getByTestId('nft-card').first().locator('h3')).toHaveText(firstName)
  await expect(page.getByRole('status', { name: 'Carregando página', exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL('/?q=Golden')
  expect(await hero!.evaluate(node => node.isConnected)).toBe(true)
  expect(documents).toBe(1)
})
