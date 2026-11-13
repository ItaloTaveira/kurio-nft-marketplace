import { expect, test } from '@playwright/test'

test('início carrega com imagens locais e sem overflow horizontal', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const images = page.locator('img:visible')
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded()
    await expect(image).toHaveJSProperty('complete', true)
    expect(await image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('explorar chega ao mercado e o atalho de teclado chega ao conteúdo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await page.getByRole('link', { name: 'EXPLORAR', exact: true }).click()
  await expect(page).toHaveURL(/#mercado$/)
  await expect(page.getByTestId('nft-card').first()).toBeInViewport()
})

test('rota inexistente permite voltar ao início e recarregar', async ({ page }) => {
  await page.goto('/rota-inexistente')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL('/')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
