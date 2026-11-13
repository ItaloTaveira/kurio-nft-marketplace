# Kurio — NFT Marketplace

**Demonstração pública:** https://kurio-nft-marketplace-gold.vercel.app

Frontend do desafio Jungle Gaming, com catálogo, detalhe, favoritos, carrinho, conta, carteiras e compra simulada. React/TypeScript, Vite, Tailwind/shadcn, TanStack Router/Query, Axios, MSW e Socket.IO.

## Executar

Node.js 22.12+ e npm:

```sh
npm ci
npx playwright install chromium
npm run dev
```

Mocks ficam ativos por padrão, inclusive no build de demonstração. Não há pagamentos, assinaturas ou movimentação blockchain real. Carteiras e referências de transação são fictícias.

## Contas de demonstração

| Conta | Senha fictícia |
| --- | --- |
| `nova@kurio.test` | `Kurio123!` |
| `leo@kurio.test` | `Kurio123!` |

Os botões sociais usam `google.demo@kurio.test` e `facebook.demo@kurio.test`, criados no primeiro acesso, com a mesma senha fictícia `Kurio123!` para explorar o perfil. Cada provedor tem uma conta e carrinho próprios.

As contas são inicializadas sem sobrescrever usuários existentes. Também é possível cadastrar contas fictícias. Senhas persistem como hash PBKDF2 com salt, nunca em claro. Dados são locais ao navegador; sessão pertence à aba e sobrevive a refresh.

## Fluxos

- `/`: busca, filtros combinados, ordenação e paginação na URL.
- `/nfts/emerald-ape-042`: galeria, edição, estoque, quantidade e favoritos.
- `/favoritos`: lista persistida e isolada por usuário, com rollback de falha.
- `/carrinho`: unidades, remoção, cupons `KURIO10`/`BEMVINDO5` e totais da API; itens do visitante são mesclados ao entrar.
- `/perfil` e `/carteiras`: dados, avatar, senha e carteiras principal/secundária.
- `/pagamento`: conexão simulada, revisão explícita e pedido idempotente.
- `/pedidos/:id`: processamento, confirmação ou recusa; recibo conserva o snapshot confirmado.

Para comprar, cadastre uma carteira Ethereum fictícia como `0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, adicione Emerald Ape #042 e use **Conectar e finalizar**. Duas unidades a 1.19 ETH somam **2.396 ETH**, incluindo taxa simulada. Cada pedido exige uma única rede compatível com a carteira; não há bridge automático.

Atividade, ofertas, downloads, suporte e páginas editoriais estão fora do escopo do enunciado e permanecem sem confirmação funcional. Google/Facebook oferecem entrada demonstrativa com contas fictícias; não há OAuth nem acesso a contas reais. Recuperação de senha permanece fora do escopo. A navegação inferior mobile está implementada.

## Comandos

| Comando | Resultado |
| --- | --- |
| `npm run build` | TypeScript + build de produção |
| `npm run lint` | Oxlint |
| `npm run test:e2e -- tests/e2e` | Testes funcionais Chromium em desktop/tablet/mobile |
| `npm run test:visual` | Regressão visual de início, detalhe, carrinho e pagamento |
| `npm run test:visual -- --update-snapshots` | Atualiza referências; revisar imagens antes de aceitar |
| `npm run test:report` | Relatório HTML do Playwright |
| `npm run images:optimize` | Gera WebP a partir dos PNGs originais preservados |
| `npm run audit:mobile` / `npm run audit:desktop` | Três medições de início e detalhe por perfil |
| `node scripts/audit-summary.mjs` | Medianas e métricas dos relatórios Lighthouse |

As referências visuais são produzidas em Chromium/macOS com fonte local; não são prova de equivalência ao Figma. A revisão de pagamento, recibo, rodapé e navegação mobile usa a exportação local do Figma. Escopo, diferenças intencionais e assets ausentes estão em [docs/design-review.md](docs/design-review.md); não se declara equivalência integral ao desenho.

## Tempo real e cenários

O cliente usa `socket.io-client`, transporte WebSocket e handshake Socket.IO. MSW + `@mswjs/socket.io-binding` simulam `nft.updated` e `order.updated`, com identidade/versão, descarte de duplicatas e reconciliação REST após reconectar. O pedido só confirma após a API retornar `confirmed`.

Exemplo reproduzível no console do navegador:

```js
await fetch('/api/mock/events', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'nft', nftId: 'emerald-ape-042', priceEth: '1.50', remaining: 1 })
})
```

Para interrupção: `{ type: 'disconnect', durationMs: 1800 }`. Para duplicata/antigo: `{ type: 'nft', nftId: 'emerald-ape-042', mode: 'duplicate' }` ou `mode: 'old'`. O endpoint só existe na camada de mocks e atualiza o estado REST antes de emitir eventos, sem setters da UI.

Cenários completos e reset estão em [docs/testing.md](docs/testing.md). Chaves principais: `kurio:catalog-scenario`, `kurio:nft-scenario`, `kurio:cart-scenario`, `kurio:auth-scenario`, `kurio:account-scenario`, `kurio:favorites-scenario`, `kurio:checkout-scenario`. Checkout inclui `pending`, `declined`, `fee-changed` e `timeout-after-submit`.

Reset de todos os dados/cenários desta aplicação:

```js
for (const key of Object.keys(localStorage)) if (key.startsWith('kurio:')) localStorage.removeItem(key)
for (const key of Object.keys(sessionStorage)) if (key.startsWith('kurio:')) sessionStorage.removeItem(key)
location.assign('/')
```

## Arquitetura e configuração

- `src/app`: providers e árvore de rotas, com carregamento sob demanda.
- `src/routes` / `src/features`: páginas e funcionalidades.
- `src/shared`: contratos Zod, transporte, componentes e assets locais.
- `src/mocks`: REST, persistência e servidor Socket.IO simulado.
- `src/realtime`: cliente de eventos e reconciliação com Query.
- `tests`: fluxos E2E e referências visuais.
- `lighthouse`: configuração e relatórios das auditorias.

Consulte [ARCHITECTURE.md](ARCHITECTURE.md) e [docs/api-contracts.md](docs/api-contracts.md). Com `VITE_ENABLE_MOCKS=false`, é necessário fornecer backend real compatível em `VITE_API_BASE_URL` e Socket.IO em `VITE_SOCKET_URL`; não há fallback fictício nos componentes.

## Publicação e estado da entrega

`vercel.json` e `public/_redirects` preparam Vercel/Netlify com fallback SPA para acesso direto/refresh. Build: `npm run build`; pasta: `dist`; Node 22. Os mocks devem permanecer ativos na demonstração. Repositório: [ItaloTaveira/kurio-nft-marketplace](https://github.com/ItaloTaveira/kurio-nft-marketplace), criado como privado. Aplicação publicada na Vercel: [kurio-nft-marketplace-gold.vercel.app](https://kurio-nft-marketplace-gold.vercel.app).

A CI em `.github/workflows/checks.yml` prepara Chromium e roda lint/testes funcionais após o projeto ser enviado a um repositório. Relatórios HTML/JSON Lighthouse e resumo ficam em `lighthouse/reports`; o relatório Playwright fica em `playwright-report` após execução. Resultados e limitações são registrados em [docs/validation.md](docs/validation.md).

Persistem 15 alertas em dependências de desenvolvimento ligadas a Lighthouse/LHCI/shadcn CLI (2 baixos, 4 moderados, 9 altos); não foi usado `npm audit fix --force`. Esses alertas não foram resolvidos pela inclusão do Sharp e devem ser revisados antes de adotar a toolchain em produção.
