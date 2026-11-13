import { test, expect, type Page } from '@playwright/test'
const password = 'Colecionador123!'
async function register(page: Page, email = 'nova@example.com', name = 'Nova') {
  await page.goto('/cadastro?returnTo=%2Fcarrinho')
  await page.getByRole('textbox', { name: 'Nome de usuário', exact: true }).fill(name)
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ }).click()
  await expect(page).toHaveURL('/carrinho')
  await expect(page.getByLabel(`Conta de ${name}`, { exact: true }).filter({ visible: true })).toBeVisible()
}
async function login(page: Page, email = 'nova@example.com') {
  await page.goto('/entrar?returnTo=%2Fcarrinho')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/carrinho')
}
async function logout(page: Page, name = 'Nova') {
  await page.getByLabel(`Conta de ${name}`, { exact: true }).filter({ visible: true }).click()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible()
}
async function buy(page: Page, quantity = 1) {
  await page.goto(`/nfts/emerald-ape-042?quantity=${quantity}`)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(page.getByTestId('cart-item')).toHaveCount(1)
}

test('cadastro preserva carrinho, recupera sessão e isola troca de conta', async ({ page }) => {
  await buy(page, 2)
  await register(page)
  await expect(page.getByTestId('cart-item')).toHaveCount(1)
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('2.396 ETH')
  await page.reload()
  await expect(page.getByLabel('Conta de Nova', { exact: true }).filter({ visible: true })).toBeVisible()
  const stored = await page.evaluate(() => localStorage.getItem('kurio:auth:v1'))
  expect(stored).not.toContain(password)
  expect(stored).toContain('digest')
  await logout(page)
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await register(page, 'outra@example.com', 'Outra')
  await expect(page.getByTestId('cart-item')).toHaveCount(0)
  await logout(page, 'Outra')
  await login(page)
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('2.396 ETH')
})

test('mescla visitante com conta sem descartar excesso de estoque ou repetir transferência', async ({ page }) => {
  await register(page)
  await buy(page, 2)
  await logout(page)
  await buy(page, 2)
  await login(page)
  await expect(page.getByTestId('cart-item').getByRole('spinbutton')).toHaveValue('4')
  await expect(page.getByText(/apenas 3 unidades disponíveis/)).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('cart-item').getByRole('spinbutton')).toHaveValue('4')
})

test('validação, confirmação de senha e mostrar senha são acessíveis', async ({ page }) => {
  await page.goto('/cadastro')
  await page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ }).click()
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Nome de usuário', exact: true })).toBeFocused()
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Diferente123!')
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click()
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ }).click()
  await expect(page.getByText('As senhas precisam ser iguais.')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('credenciais incorretas e conflito de cadastro mantêm formulário para correção', async ({ page }) => {
  await register(page)
  await logout(page)
  await page.goto('/entrar')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('nova@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('SenhaErrada')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
  await page.goto('/cadastro')
  await page.getByRole('textbox', { name: 'Nome de usuário', exact: true }).fill('Duplicada')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('NOVA@example.com')
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ }).click()
  await expect(page.getByRole('alert')).toHaveText('Este e-mail já está cadastrado. Entre na sua conta.')
})

test('expiração mantém conta e carrinho para retomar no mesmo destino', async ({ page }) => {
  await register(page)
  await buy(page)
  const resumePath = new URL(page.url()).pathname + new URL(page.url()).search
  await page.evaluate(() => localStorage.setItem('kurio:auth-scenario', 'expired'))
  await page.reload()
  await expect(page.getByRole('link', { name: 'Entre novamente para continuar' })).toBeVisible()
  await page.getByRole('link', { name: 'Entre novamente para continuar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('kurio:auth-scenario'))
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('nova@example.com')
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(resumePath)
  await expect(page.getByLabel('Total do carrinho', { exact: true })).toHaveText('1.206 ETH')
})

test('falha transitória permite repetir e redirecionamento externo é rejeitado', async ({ page }) => {
  await page.goto('/cadastro?returnTo=https%3A%2F%2Fexample.com')
  await page.getByRole('textbox', { name: 'Nome de usuário', exact: true }).fill('Nova')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('nova@example.com')
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(password)
  await page.evaluate(() => localStorage.setItem('kurio:auth-scenario', 'error'))
  await page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ }).click()
  await expect(page.getByRole('alert')).toHaveText('O serviço de conta está indisponível. Tente novamente.')
  await page.evaluate(() => localStorage.removeItem('kurio:auth-scenario'))
  await page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ }).click()
  await expect(page).toHaveURL('/')
  // No mobile o acesso à conta fica na navegação inferior, como no frame.
  await page.goto('/perfil')
  await expect(page.getByLabel('Conta de Nova', { exact: true }).filter({ visible: true })).toBeVisible()
})

test('resposta atrasada de carrinho não reaparece após encerrar a sessão', async ({ page }) => {
  await register(page)
  await buy(page)
  await page.evaluate(() => localStorage.setItem('kurio:cart-scenario', 'slow'))
  const reply = page.waitForResponse(response => response.request().method() === 'PATCH' && response.url().includes('/api/cart/items/'))
  await page.getByTestId('cart-item').getByRole('button', { name: 'Aumentar quantidade', exact: true }).click()
  await page.evaluate(() => {
    sessionStorage.removeItem('kurio:session-token')
    window.dispatchEvent(new Event('kurio:session-changed'))
  })
  await reply
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await expect(page.getByTestId('cart-item')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible()
})
