# Testes e cenários do catálogo

Execute `npm run test:e2e`. O comando gera o build e inicia o preview com MSW ativo por padrão. Cada teste usa um contexto novo do navegador. Os testes exercitam a UI e as respostas REST interceptadas pelo worker, sem interceptações Playwright que substituam os handlers.

A suíte cobre busca, vazio, limpeza, filtros combinados, ordenação, paginação, histórico, refresh, precisão decimal, skeletons, falha 503/recuperação, respostas fora de ordem, teclado, contenção e retorno de foco nos painéis. Os perfis são Chromium em 1440, 768 e 390 px; o teste específico do painel mobile é omitido no desktop.

`npm run test:report` abre o relatório HTML. Traces são retidos em falhas. Regressão visual com baselines ainda não foi implementada; as capturas manuais desta etapa não substituem esse requisito.

## Cenários reproduzíveis

No console do navegador, selecione um cenário e recarregue:

```js
localStorage.setItem('kurio:catalog-scenario', 'slow')
location.reload()
```

| Cenário | Comportamento |
| --- | --- |
| `success` | 36 NFTs, quatro páginas, latência de 350 ms |
| `empty` | Lista vazia |
| `slow` | Latência de 2000 ms, para observar skeletons |
| `error` | HTTP 503, com opção de tentar novamente |
| `offline` | Falha de rede simulada pelo MSW |
| `out-of-order` | Busca com até 3 caracteres demora 1800 ms; buscas maiores, 150 ms |

Para recuperar um erro sem recarregar, altere o cenário para `success` e clique em **Tentar novamente**. Para testar concorrência, selecione `out-of-order`, envie uma busca por `Ape` e rapidamente outra por `Golden`. O resultado final deve conter somente Golden.

Reset completo da simulação atual:

```js
localStorage.removeItem('kurio:catalog-scenario')
location.reload()
```

Nesta etapa, as fixtures são imutáveis e não existem mutations de negócio; o reset elimina o cenário selecionado e o cache em memória ao recarregar. Persistência, usuários e reset das compras serão acrescentados nas próximas etapas.

Mocks ativos exigem o worker em `/mockServiceWorker.js`. Se a inicialização falhar, a aplicação oferece recarregamento em vez de iniciar consultas sem mocks. Em deploy, servir esse arquivo como JavaScript e manter fallback SPA nas demais rotas.

## Cenários do detalhe

A seleção usa outra chave para permitir combinar falhas da listagem e do detalhe:

```js
localStorage.setItem('kurio:nft-scenario', 'stock-reduced')
location.reload()
```

| Cenário | Comportamento |
| --- | --- |
| `success` | Galeria, metadados, quatro edições, avaliações e relacionados |
| `slow` | Latência de 2000 ms para observar o skeleton |
| `error` | Resposta HTTP 503 |
| `offline` | Falha de rede |
| `sold-out` | Todas as edições sem estoque |
| `stock-reduced` | Estoque da edição padrão reduzido para 1 |

Para reproduzir a recuperação de quantidade: selecione `stock-reduced` e abra `/nfts/emerald-ape-042?quantity=3`. A seleção e a URL devem ser limitadas a uma unidade. Para testar 404, abra `/nfts/nao-existe`; para edição inválida, `/nfts/emerald-ape-042?edition=desconhecida`.

Para resetar ambas as etapas:

```js
localStorage.removeItem('kurio:catalog-scenario')
localStorage.removeItem('kurio:nft-scenario')
location.reload()
```

Os testes de `tests/e2e/nft.spec.ts` cobrem acesso via card e por URL, retorno com contexto do catálogo, refresh, preço/subtotal, limites e quantidade fracionária, estoque reduzido, esgotamento, 404, edição inválida, zoom/seleção por teclado, foco ao fechar, avaliações, skeleton e recuperação de falha de rede. Miniaturas e edições mantêm seleção e foco sincronizados inclusive com pressionamentos rápidos das setas.

## Cenários do carrinho

Selecione o cenário pela chave `kurio:cart-scenario`. O armazenamento do carrinho é independente dos caches em memória do Query.

| Cenário | Comportamento |
| --- | --- |
| `success` | Carrinho vazio na primeira visita, operações e persistência ativas |
| `seeded` | Inicializa um carrinho novo com quatro linhas e seis unidades |
| `slow` | Latência de 1800 ms |
| `error` | HTTP 503 para consultas e alterações |
| `offline` | Falha de rede |
| `mutation-error` | Consultas funcionam; alterações falham após 1200 ms, permitindo observar rollback |
| `price-changed` | Emerald Ape muda de 1.19 para 1.31 ETH no catálogo, detalhe e carrinho |
| `stock-reduced` | Estoque da edição padrão de Emerald Ape cai para uma unidade |
| `sold-out` | Edições de Emerald Ape ficam sem estoque |
| `coupon-expired` | Cupons aplicados deixam de ser válidos e novos cupons são rejeitados |

Para uma demonstração preenchida:

```js
localStorage.removeItem('kurio:guest-cart:v1')
localStorage.setItem('kurio:cart-scenario', 'seeded')
location.assign('/carrinho')
```

O cenário seeded só preenche um armazenamento novo; ele não substitui o carrinho existente. Ele contém preços e quantidades coerentes com as fixtures, subtotal de 8.14 ETH e total de 8.156 ETH. Os valores ilustrativos inconsistentes do frame mobile não são utilizados nos cálculos.

Para verificar rollback, altere o cenário para `mutation-error` sem apagar os itens e remova uma linha. Ela desaparece otimisticamente e retorna após a falha. Troque para `success` e repita a ação para concluir.

Para testar revisão de preço, adicione Emerald Ape no cenário success, selecione `price-changed` e recarregue `/carrinho`. O resumo deve mudar e oferecer aceite dos novos preços. Para estoque, mantenha duas unidades antes de selecionar `stock-reduced`: o item deve permanecer com aviso e permitir reduzir a quantidade. Essas mudanças são reavaliadas por REST; eventos Socket.IO ainda não foram implementados.

Reset de todos os cenários e do carrinho:

```js
for (const key of ['kurio:catalog-scenario', 'kurio:nft-scenario', 'kurio:cart-scenario', 'kurio:guest-cart:v1']) localStorage.removeItem(key)
location.reload()
```

A suíte `tests/e2e/cart.spec.ts` cobre vazio, adição, contador, refresh, agrupamento por edição, limite acumulado, alterações/remoções, cupons, rollback, revisão de preço, estoque reduzido, expiração posterior do cupom, clique repetido e recuperação de falhas. Os contextos do Playwright são isolados e não acessam o carrinho do navegador pessoal.

## Conta e sessão

Crie uma conta fictícia em `/cadastro` (senha com pelo menos 8 caracteres). Em desktop, a entrada aparece como modal sobre o marketplace; em mobile/tablet, como página. O menu com o nome no cabeçalho permite sair. Para testar transferência, adicione um NFT como visitante antes de criar a conta. Faça logout e login para conferir o carrinho por usuário.

Cenários pela chave `kurio:auth-scenario`:

| Valor | Comportamento |
| --- | --- |
| ausente / `success` | Cadastro, login, consulta e logout normais |
| `slow` | Resposta após 1,8 s; formulário bloqueado durante envio |
| `error` | Serviço indisponível com resposta 503 |
| `offline` | Falha de rede |
| `expired` | Tokens existentes são recusados com 401 |

Para expirar durante a navegação, entre, defina `expired` e recarregue a página. O aviso oferece retomada na rota atual; remova o cenário antes de entrar novamente. A expiração natural também tem timer de uma hora. Sem sessão, o usuário continua explorando como visitante.

Reset completo de conta, sessões e carrinhos (apenas no navegador de teste):

```js
for (const key of Object.keys(localStorage)) {
  if (key.startsWith('kurio:')) localStorage.removeItem(key)
}
for (const key of Object.keys(sessionStorage)) {
  if (key.startsWith('kurio:')) sessionStorage.removeItem(key)
}
location.assign('/')
```

`tests/e2e/auth.spec.ts` cobre criação/refresh, hash sem senha em claro, logout, troca de conta, transferência e mesclagem de carrinho com excesso de estoque, validação/confirmação, mostrar senha, credenciais inválidas, conflito, falha transitória, expiração/retomada e rejeição de redirecionamento externo nos três perfis. Integrações sociais e recuperação de senha foram removidas da interface para não oferecer ações sem implementação.

## Perfil e carteiras

Após entrar, abra o menu do nome no cabeçalho e escolha **Meu perfil** ou **Minhas carteiras**. URLs diretas `/perfil` e `/carteiras` exigem login e retornam ao destino após autenticar. A navegação lateral vira navegação compacta no mobile/tablet.

- Perfil: altere nome/username/e-mail, salve e recarregue. Nome/e-mail do menu acompanham a resposta. ENS aceita apenas o nome, sem `.eth`; ENS e apelido da carteira são opcionais.
- Avatar: envie PNG/JPEG/WebP de até 200 KB e 1024 × 1024 px. A prévia não é salva até clicar **Salvar**. Remover também precisa ser confirmado com **Salvar**.
- Senha: preencha atual, nova e confirmação. Senha atual incorreta deve rejeitar todas as alterações de perfil enviadas juntas. Após sucesso, a senha anterior deixa de autenticar e outras sessões são revogadas.
- Carteiras: cadastre um endereço fictício como `0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`; a secundária pode usar `0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`. Para Solana, a fixture sintática `11111111111111111111111111111111` é aceita. Nenhuma carteira real é conectada.
- Marque **Igual à carteira principal** somente após salvar a principal. A opção só muda após confirmação da API; o checkbox fica desabilitado durante o envio. Desmarcar restaura uma secundária independente previamente salva.
- Abra duas abas com a mesma conta, edite em ambas e salve uma primeiro. A segunda deve manter o rascunho, avisar conflito e oferecer recarregar os dados salvos.

Cenários via `kurio:account-scenario`: `slow` (1,8 s), `error` (503 em leitura/escrita), `mutation-error` (503 somente nas gravações), `offline` (falha de rede) ou ausente/`success`. O cenário de expiração continua em `kurio:auth-scenario`. Reset completo com o trecho da seção de conta também remove perfil e carteiras.

`tests/e2e/account.spec.ts` verifica proteção/retomada, perfil/avatar/remoção persistentes, atomicidade e troca de senha, rede/endereço, duplicidade e vinculação de carteiras, falha com rascunho preservado, expiração, isolamento entre contas, conflito entre abas e revogação de outra sessão. Rodar nos três projetos Chromium.

A revisão visual manual verificou 390, 414, 768 e 1440 px, sem overflow e sem erros JavaScript. A referência detalhada do perfil foi consultada; o MCP do Figma atingiu a cota Starter ao consultar carteiras. Essa tela segue os componentes/tokens existentes e requisitos funcionais, mas sua comparação visual com o frame completo permanece pendente. Não há baseline visual automatizada nova nesta etapa.

## Checkout e confirmação

Fluxo básico:

1. Crie/entre em uma conta e cadastre uma carteira principal Ethereum fictícia, por exemplo `0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`.
2. Adicione Emerald Ape #042, edição 1/50, ao carrinho. Ele está na rede Ethereum.
3. Clique **Conectar e finalizar**, conecte a carteira simulada e clique **Revisar pedido**.
4. Confira o resumo e clique **Confirmar compra**. O pedido passa por pendente antes de confirmar.
5. Recarregue o recibo e consulte o carrinho: somente as unidades compradas devem ter sido removidas.

Duas unidades a 1.19 ETH sem cupom resultam em subtotal 2.38 ETH e total 2.396 ETH, com taxa Ethereum 0.016 ETH. O carrinho de demonstração `seeded` mistura redes: ele precisa ser separado por rede antes do checkout. Não cadastre chaves privadas ou carteiras reais; todos os endereços/provedores são demonstrativos.

Cenários em `kurio:checkout-scenario`:

| Valor | Comportamento |
| --- | --- |
| ausente / `success` | Conecta, revisa e confirma o pedido normalmente |
| `slow` | Respostas em aproximadamente 1,8 s |
| `error` | 503 antes da operação |
| `offline` | Erro de rede antes da operação |
| `connection-refused` | Recusa a conexão simulada |
| `disconnected` | Conexões existentes deixam de ser aceitas |
| `fee-changed` | Taxas de rede aumentam 50%; exige nova revisão se já revisado |
| `declined` | Novos pedidos são processados como recusados |
| `pending` | Mantém pedidos pendentes; remover o cenário permite processá-los nas próximas consultas |
| `timeout-after-submit` | Persiste o pedido, mas perde a resposta do POST; recuperação deve usar a mesma tentativa |

Para testar revalidação, revise primeiro e depois altere `kurio:cart-scenario` para `price-changed`, `sold-out` ou `coupon-expired` (com cupom aplicado). Confirmação não pode prosseguir silenciosamente; ajuste o carrinho e revise novamente. Alterar taxa/estoque durante `pending` também deve impedir confirmação com condições obsoletas. Em `pending`, adicione mais uma unidade ao carrinho e depois libere o cenário: somente a quantidade do pedido original deve ser subtraída.

`/pagamento` e `/pedidos/:id` exigem autenticação. O rascunho válido e a tentativa pendente ficam no sessionStorage por usuário e sobrevivem a refresh/novo login na mesma aba. O pedido também pode ser recuperado pelo ID da URL e pela chave persistida no servidor simulado. Se a sessão expirar durante envio/consulta, entre novamente para retomar. Os dados confirmados não são apagados no logout.

O reset completo da seção de conta remove também `kurio:commerce:v1`, rascunhos, tentativas, reservas e marcadores do carrinho. Remover apenas o carrinho não reinicializa estoque consumido pelos pedidos. Os contextos isolados de Playwright não alteram dados do navegador pessoal.

`tests/e2e/checkout.spec.ts` cobre confirmação/recibo imutável, consumo de estoque, taxa alterada com revisão explícita, recusa e nova tentativa, resposta perdida, pendente após refresh, subtração parcial, conexão recusada/desconexão/rede, expiração/retomada, idempotência concorrente, preço e estoque alterados e cupom expirado. A revisão manual verificou checkout e confirmação em 390, 414, 768 e 1440 px, sem overflow ou erros JavaScript, com imagens locais carregadas. Comparação visual completa com o Figma permanece pendente pela cota Starter do MCP.

## Favoritos, navegação mobile e Socket.IO

Contas pré-carregadas: `nova@kurio.test` e `leo@kurio.test`, senha fictícia `Kurio123!`. Elas usam IDs estáveis para os cenários e hashes com salts distintos; o inicializador não sobrescreve contas existentes. O reset completo também restaura essas contas no próximo carregamento.

Favoritos usam `kurio:favorites-scenario`: ausente/success, `slow`, `error`, `offline` e `mutation-error`. Confirme persistência após o término da gravação, faça logout e confira isolamento na outra conta. Uma remoção com falha deve reaparecer com feedback, sem confirmação falsa de gravação.

Tempo real é disparado pela camada MSW, passando por `socket.io-client`. No console:

```js
await fetch('/api/mock/events', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'nft', nftId: 'emerald-ape-042', priceEth: '1.50', remaining: 1 })
})
```

O carrinho aberto deve mudar para os valores atuais e pedir revisão. `mode: 'duplicate'` ou `mode: 'old'` não modifica o estado canônico nem deve regredir o resumo. Para desconexão, envie `{ type: 'disconnect', durationMs: 1800 }`; altere o NFT durante a interrupção e confira a reconciliação REST após reconectar. A inicialização de handshake durante indisponibilidade é simulada antes do fechamento para que a reconexão seja observável no protocolo.

`tests/e2e/favorites-realtime.spec.ts` verifica favoritos/rollback/isolamento, preço e disponibilidade via Socket.IO, mensagens antigas/duplicadas, interrupção/reconexão, evento de pedido com confirmação pela API e ausência de dados do recibo na outra conta. Não injeta setters/cache da UI.

## Referências visuais e auditoria

`tests/visual/pages.spec.ts` cobre início, detalhe, carrinho preenchido e pagamento revisado nos três viewports. Relógio, conta, carteira, dados e carregamento de imagens/fontes são estabilizados. Referências ficam junto ao teste em `pages.spec.ts-snapshots`; devem ser revisadas visualmente ao atualizar. Baselines macOS/Chromium podem exigir ambiente equivalente ou novas referências revisadas em Linux; a CI funcional não recria screenshots automaticamente.

Lighthouse usa build de produção, mocks/Socket.IO ativos, Chromium do Playwright e três execuções por URL/perfil. `lighthouse/config/base.cjs` inclui início e detalhe; desktop herda essa lista. Execute os perfis sequencialmente para evitar disputa de CPU. `scripts/audit-summary.mjs` gera medianas de categorias e LCP/CLS/TBT. Relatórios brutos HTML/JSON acompanham a entrega local; resultados abaixo das metas devem permanecer explícitos, sem esconder funcionalidades para melhorar a medição.


### Regressões do retorno de uso

`tests/e2e/reported-fixes.spec.ts` verifica cancelamento do login iniciado pelo pagamento, X/Escape/clique externo no desktop, altura do cabeçalho ao abrir a conta após acesso direto, cadastro de carteira após adicionar item, reconciliação do rascunho e estimativa de taxas por rede, placeholder curto e ausência de ações de autenticação indisponíveis. O carrinho de Solana também é testado com taxa simulada de 0.001 ETH equivalente. A suíte visual inclui confirmação e fechamento do recibo, com relógio controlado, máscaras de identificadores e aviso transitório oculto somente nas capturas.
