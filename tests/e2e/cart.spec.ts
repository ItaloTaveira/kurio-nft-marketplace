import { expect, test, type Page } from '@playwright/test'

const scenarioKey = 'kurio:cart-scenario'
const nftPath = '/nfts/emerald-ape-042'
const rows = (page: Page) => page.getByTestId('cart-item')
const firstRow = (page: Page) => rows(page).filter({ has: page.getByRole('heading', { name: 'Emerald Ape #042', exact: true }) })
async function seeded(page: Page) {
  await page.addInitScript(key => { if (localStorage.getItem(key) === null) localStorage.setItem(key, 'seeded') }, scenarioKey)
  await page.goto('/carrinho')
  await expect(rows(page)).toHaveCount(4)
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('8.156 ETH')
}
async function buy(page: Page, query = '') {
  await page.goto(`${nftPath}${query}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Emerald Ape #042')
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(rows(page).first()).toBeVisible()
}
async function coupon(page: Page, code: string) {
  await page.getByRole('textbox', { name: 'Código promocional', exact: true }).fill(code)
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
}

test('vazio, adição, contador e refresh preservam a seleção e os valores', async ({ page }) => {
  await page.goto('/carrinho')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio', exact: true })).toBeVisible()
  await buy(page, '?quantity=2')
  await expect(rows(page)).toHaveCount(1)
  await expect(firstRow(page).getByRole('spinbutton', { name: 'Quantidade', exact: true })).toHaveValue('2')
  await expect(page.getByLabel('Subtotal', { exact: true })).toHaveText('2.38 ETH')
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('2.396 ETH')
  await page.reload()
  await expect(firstRow(page).getByRole('spinbutton', { name: 'Quantidade', exact: true })).toHaveValue('2')
  await page.goto('/')
  await page.getByRole('link', { name: /^(Carrinho de NFTs, 2 itens|Carrinho)$/ }).click()
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('2.396 ETH')
})

test('mesma edição acumula; edições diferentes permanecem separadas', async ({ page }) => {
  await buy(page)
  await buy(page)
  await expect(rows(page)).toHaveCount(1)
  await expect(firstRow(page).getByRole('spinbutton', { name: 'Quantidade', exact: true })).toHaveValue('2')
  await buy(page, '?edition=limited-10')
  await expect(rows(page)).toHaveCount(2)
  await expect(page.getByLabel('Subtotal', { exact: true })).toHaveText('4.17 ETH')
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('4.186 ETH')
})

test('edição respeita o limite combinado com o que já está no carrinho', async ({ page }) => {
  await buy(page, '?quantity=2')
  await page.goto(`${nftPath}?quantity=2`)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page.getByRole('alert')).toContainText('limite para esta edição é de 3')
  await page.goto('/carrinho')
  await expect(rows(page)).toHaveCount(1)
  await expect(firstRow(page).getByRole('spinbutton', { name: 'Quantidade', exact: true })).toHaveValue('2')
})

test('quantidades e remoção atualizam o resumo retornado pela API', async ({ page }) => {
  await seeded(page)
  await firstRow(page).getByRole('button', { name: 'Aumentar quantidade', exact: true }).click()
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('9.346 ETH')
  const violet = rows(page).filter({ has: page.getByRole('heading', { name: 'Violet Nomad #314', exact: true }) })
  await violet.getByRole('button', { name: /^Remover / }).click()
  await expect(rows(page)).toHaveCount(3)
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('7.956 ETH')
  await page.reload()
  await expect(rows(page)).toHaveCount(3)
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('7.956 ETH')
})

test('cupom válido, inválido, expirado e remoção preservam valores corretos', async ({ page }) => {
  await seeded(page)
  await coupon(page, 'kurio10')
  await expect(page.getByLabel('Desconto', { exact: true })).toHaveText('− 0.814 ETH')
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('7.342 ETH')
  await coupon(page, 'INVALIDO')
  await expect(page.getByRole('alert')).toContainText('Cupom inválido')
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('7.342 ETH')
  await coupon(page, 'EXPIRADO')
  await expect(page.getByRole('alert')).toContainText('Este cupom expirou')
  await page.getByRole('button', { name: 'Remover cupom', exact: true }).click()
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('8.156 ETH')
})

test('remoção otimista volta ao estado anterior se a mutation falhar', async ({ page }) => {
  await seeded(page)
  await page.evaluate(key => localStorage.setItem(key, 'mutation-error'), scenarioKey)
  const optimisticRemoval = page.waitForFunction(() => document.querySelectorAll('[data-testid="cart-item"]').length === 3, undefined, { polling: 'raf' })
  await firstRow(page).getByRole('button', { name: /^Remover / }).click()
  await optimisticRemoval
  await expect(rows(page)).toHaveCount(4)
  await expect(page.getByRole('alert')).toContainText('Não foi possível atualizar o carrinho')
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('8.156 ETH')
  await page.evaluate(key => localStorage.setItem(key, 'success'), scenarioKey)
  await firstRow(page).getByRole('button', { name: /^Remover / }).click()
  await expect(rows(page)).toHaveCount(3)
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('6.966 ETH')
})

test('preço alterado exige revisão e é consistente entre carrinho e detalhe', async ({ page }) => {
  await seeded(page)
  await page.evaluate(key => localStorage.setItem(key, 'price-changed'), scenarioKey)
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('preço alterado de 1.19 para 1.31 ETH')
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('8.276 ETH')
  await page.getByRole('button', { name: 'Aceitar novos preços', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Aceitar novos preços', exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('8.276 ETH')
  await page.goto(nftPath)
  await expect(page.getByLabel('Subtotal da seleção', { exact: true })).toHaveText('1.31 ETH')
})

test('estoque reduzido mantém o item e permite corrigir a quantidade', async ({ page }) => {
  await seeded(page)
  await firstRow(page).getByRole('button', { name: 'Aumentar quantidade', exact: true }).click()
  await expect(firstRow(page).getByRole('spinbutton', { name: 'Quantidade', exact: true })).toHaveValue('2')
  await page.evaluate(key => localStorage.setItem(key, 'stock-reduced'), scenarioKey)
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('apenas 1 unidades disponíveis')
  await expect(firstRow(page).getByRole('spinbutton', { name: 'Quantidade', exact: true })).toHaveValue('2')
  await firstRow(page).getByRole('button', { name: 'Diminuir quantidade', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('8.156 ETH')
})

test('cupom que expira depois de aplicado pode ser removido', async ({ page }) => {
  await seeded(page)
  await coupon(page, 'KURIO10')
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('7.342 ETH')
  await page.evaluate(key => localStorage.setItem(key, 'coupon-expired'), scenarioKey)
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('O cupom expirou')
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('8.156 ETH')
  await page.getByRole('button', { name: 'Remover cupom', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('falha na adição permite nova tentativa e clique repetido não duplica', async ({ page }) => {
  await page.addInitScript(key => { if (localStorage.getItem(key) === null) localStorage.setItem(key, 'mutation-error') }, scenarioKey)
  await page.goto(nftPath)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível atualizar o carrinho')
  await page.evaluate(key => localStorage.setItem(key, 'success'), scenarioKey)
  // Dispara ambos os cliques no mesmo elemento antes da resposta. No mobile,
  // dblclick por coordenadas pode atingir um link do carrinho após a navegação.
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).evaluate(button => {
    (button as HTMLButtonElement).click()
    ;(button as HTMLButtonElement).click()
  })
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(rows(page)).toHaveCount(1)
  await expect(firstRow(page).getByRole('spinbutton', { name: 'Quantidade', exact: true })).toHaveValue('1')
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('1.206 ETH')
})

test('loading e erro de consulta não apagam o carrinho persistido', async ({ page }) => {
  await seeded(page)
  await page.evaluate(key => localStorage.setItem(key, 'slow'), scenarioKey)
  await page.reload()
  await expect(page.getByRole('status', { name: 'Carregando carrinho', exact: true })).toBeVisible()
  await expect(rows(page)).toHaveCount(4)
  await page.evaluate(key => localStorage.setItem(key, 'error'), scenarioKey)
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Seus itens não foram descartados')
  await page.evaluate(key => localStorage.setItem(key, 'success'), scenarioKey)
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(rows(page)).toHaveCount(4)
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('8.156 ETH')
})
