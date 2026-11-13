# Contratos REST — catálogo

Os contratos executáveis estão em `src/shared/contracts/catalog.ts`. O cliente Axios valida a resposta com Zod antes de entregá-la ao cache. Os handlers MSW usam os mesmos tipos; componentes não importam fixtures ou cenários.

## GET /api/nfts

Consulta pública. Os parâmetros opcionais são:

| Parâmetro | Valores / comportamento |
| --- | --- |
| `q` | Busca parcial por nome, até 120 caracteres, sem diferença de caixa ou acentos |
| `collections` | IDs separados por vírgulas; OR dentro do grupo |
| `networks` | `ethereum`, `polygon`, `solana`, separados por vírgulas; OR dentro do grupo |
| `minPrice`, `maxPrice` | Strings decimais não negativas, até 18 casas; limites inclusivos |
| `sort` | `recent` (padrão), `price-asc`, `price-desc` |
| `tab` | `all` (padrão), `new`, `trending` |
| `page` | Inteiro de 1 a 10000, padrão 1; páginas além do total retornam lista vazia |

Todos os grupos de filtros são combinados com AND. A página contém até 9 itens. A cotação de ETH não passa por `number`: comparações e apresentação usam Decimal.js. Um desempate estável preserva a ordem entre requisições.

Exemplo: `/api/nfts?q=Ape&networks=ethereum&minPrice=0.999999999999999999&sort=price-asc&page=1`.

Resposta 200:

```json
{
  "items": [
    {
      "id": "emerald-ape-042",
      "name": "Emerald Ape #042",
      "image": "/assets/imagem-local.png",
      "imageAlt": "Macaco com óculos e jaqueta verde",
      "priceEth": "1.19",
      "collection": "digital-art",
      "network": "ethereum",
      "listedAt": "2026-11-01T00:00:00.000Z",
      "popularity": 100,
      "isNew": true,
      "imageLayout": "square"
    }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 9,
  "totalPages": 1,
  "facets": {
    "collections": { "digital-art": 4 },
    "networks": { "ethereum": 12 }
  }
}
```

O exemplo abrevia as facetas. Na implementação elas representam os totais globais do catálogo, antes dos filtros, evitando contagens instáveis na barra lateral. `previousPriceEth` é opcional. `imageLayout` preserva o recorte de apresentação do mockup.

`new` usa um marcador fixo das fixtures; `trending` seleciona popularidade >= 70 e, com ordenação recente, prioriza popularidade. Esses critérios são determinísticos, sem depender da data de execução.

No cenário de falha HTTP, a resposta é 503 com `{ "code": "CATALOG_UNAVAILABLE", "message": "O catálogo está temporariamente indisponível." }`. O cenário `offline` produz falha de rede. Detalhe, sessão e carrinho têm contratos descritos abaixo; favoritos e compra simulada estão descritos abaixo.

## URL da aplicação

O TanStack Router valida os parâmetros e remove os valores padrão ao navegar. Arrays são codificados em JSON na URL da aplicação, convertidos para listas separadas por vírgulas no transporte REST. Os preços permanecem strings; o parser de URL não usa conversão numérica automática para valores escalares. Parâmetros inválidos usam defaults seguros. Busca, filtros, aba e ordenação reiniciam a página em 1; paginação mantém os demais parâmetros. O histórico restaura a seleção anterior.

## GET /api/nfts/:nftId — detalhe

Consulta pública por identificador estável. A resposta é validada por `nftDetailSchema` em `src/shared/contracts/nft.ts` e estende o NFT do catálogo com:

| Campo | Conteúdo |
| --- | --- |
| `tokenId`, `collectionName`, `creator` | Identificação da obra e do criador |
| `description`, `mobileDescription`, `paragraphs`, `attributes` | Textos e atributos da obra |
| `contract`, `standard`, `royaltyPercent` | Metadados demonstrativos |
| `gallery` | Imagens com `id`, `src` e `alt` |
| `editions` | `id`, `label`, `priceEth` como string, estoque `remaining` e limite `maxPerOrder` |
| `defaultEditionId` | Edição inicialmente selecionada quando a URL não especifica outra |
| `reviews`, `rating` | Avaliações fictícias determinísticas e média calculada a partir delas |
| `related` | Até cinco NFTs relacionados com o mesmo contrato de card do catálogo |

A UI limita quantidade ao menor valor entre estoque e limite por pedido. Trocar de edição reinicia quantidade em 1 e muda preço unitário/subtotal. O subtotal é apenas informativo: o checkout obtém uma cotação nova da API. A edição única vem esgotada na fixture padrão para exercitar o estado indisponível.

Erros: 404 com `NFT_NOT_FOUND`; 503 com `NFT_UNAVAILABLE`; falha de conexão no cenário `offline`. O detalhe tem sua própria chave de cenário, independente da listagem.

### URL do detalhe

`/nfts/emerald-ape-042?edition=limited-10&quantity=2`

- `edition`: ID da edição, opcional. ID desconhecido exibe aviso e exige escolher uma edição disponível.
- `quantity`: inteiro de 1 a 100, padrão 1; o estoque/limite da resposta pode reduzi-lo. O ajuste normaliza a URL com replace.
- `returnTo`: rota interna do catálogo, incluindo query e marcador `#mercado`, codificada pelo Router. Somente a raiz do catálogo é aceita; não há redirecionamento para domínios externos.

O retorno ao catálogo preserva busca, filtros, aba, ordenação e página. A navegação entre obras relacionadas mantém o mesmo destino de retorno. Compra simulada e favoritos estão descritos abaixo.

## Carrinho do visitante

Os contratos executáveis estão em `src/shared/contracts/cart.ts`. Todos os endpoints retornam `CartResponse`: versão, itens com edição/quantidade/limite, contagem de unidades, recomendações e resumo da API (`quote`). Os itens são identificados pelo par NFT/edição.

| Método e recurso | Operação |
| --- | --- |
| `GET /api/cart` | Consulta e reavalia preço, estoque, cupom e taxa |
| `POST /api/cart/items` | Adiciona `{ nftId, editionId, quantity, expectedUnitPriceEth }` |
| `PATCH /api/cart/items/:itemId` | Define quantidade absoluta por `{ quantity }` |
| `DELETE /api/cart/items/:itemId` | Remove a linha |
| `PUT /api/cart/coupon` | Aplica `{ code }`, normalizado para maiúsculas |
| `DELETE /api/cart/coupon` | Remove o cupom |
| `POST /api/cart/quote/accept` | Registra aceite dos preços atuais, sem finalizar compra |

GET responde com `ETag: "<version>"`. Alteração de quantidade, remoção, cupom e aceite exigem `If-Match` com esse ETag. Versão antiga retorna 409 `CART_CONFLICT`; ausência/formato incorreto retorna 428 `VERSION_REQUIRED`. O cliente reconsulta o carrinho e permite nova tentativa explícita.

Adição exige `Idempotency-Key`. Repetir uma chave com o mesmo conteúdo não soma itens novamente; o servidor devolve o estado atual do carrinho. Reutilizá-la com outro conteúdo retorna 409 `IDEMPOTENCY_CONFLICT`. A simulação guarda as 100 chaves mais recentes. A UI mantém a chave durante uma repetição da mesma tentativa com falha e bloqueia cliques simultâneos. Mutations não têm retry automático.

A quantidade adicionada soma à já existente na mesma edição e respeita estoque/limite combinados. Edições diferentes geram linhas independentes. `expectedUnitPriceEth` protege contra adição com um preço que mudou depois de carregar o detalhe. Excesso de estoque retorna 409 `STOCK_CONFLICT`; preço divergente, 409 `PRICE_CONFLICT`. Dados de formulário inválidos retornam 422, recurso inexistente 404 e falhas simuladas 503/erro de rede.

### Resumo e cupons

`quote` contém `subtotalEth`, `discountEth`, `networkFeeEth`, `totalEth` e `currency: "ETH"`, todos os valores monetários como strings decimais. A taxa demonstrativa é fixa em `0.016` ETH para carrinho não vazio, e zero para vazio. O desconto é calculado sobre o subtotal; a taxa não recebe desconto.

- `KURIO10`: 10% de desconto.
- `BEMVINDO5`: 5% de desconto.
- `EXPIRADO`: rejeitado como cupom expirado.
- Demais códigos: rejeitados como inválidos.

Cupom inválido/expirado não substitui um cupom válido já aplicado. Remover o último item também remove o cupom. O resumo informa `issues`, `requiresReview` e `canCheckout`; alterações de preço exigem aceite explícito, enquanto redução de estoque exige ajustar/remover o item. Um cupom que expira deixa de gerar desconto e precisa ser removido ou substituído. Nenhum item é descartado nessas situações.

O ID do resumo é informativo; ele não representa uma transação. O checkout usa sua própria revisão persistida antes de criar um pedido, conforme a seção abaixo. Autenticação e migração do carrinho do visitante estão descritas na seção de conta abaixo.

## Conta e sessão

Contratos Zod em `src/shared/contracts/auth.ts`.

| Método e recurso | Resultado |
| --- | --- |
| `POST /api/auth/register` | Recebe nome, e-mail, senha e confirmação; cria conta e sessão |
| `POST /api/auth/login` | Valida e-mail/senha e inicia sessão |
| `GET /api/auth/session` | Retorna `{ user, expiresAt }`, `null` para visitante ou 401 para token inválido/expirado |
| `POST /api/auth/logout` | Revoga o token enviado; retorna `{ ok: true }` |

Login/cadastro retornam `{ token, user: { id, name, email }, expiresAt }`. E-mail é normalizado para minúsculas; cadastro exige nome de 2–40 caracteres, e-mail válido e senha de 8–128 caracteres com confirmação idêntica. Conflito de e-mail retorna 409; credenciais inválidas/validação retornam 422; falha transitória retorna 503. Não há retry automático.

A simulação persiste contas com salt individual e hash PBKDF2-SHA256 (100 mil iterações), sem senha em claro. Sessões têm validade de uma hora e são recuperadas via API. O token da aba fica no sessionStorage e vai no cabeçalho `Authorization: Bearer …`. A conta, hashes e registros do servidor simulado ficam em `kurio:auth:v1` no localStorage. Trata-se de uma API MSW local para credenciais fictícias, sem servidor de autenticação real.

O carrinho é separado por ID de usuário. Entrar/criar conta mescla as linhas do visitante à conta, agrupando NFT/edição e somando quantidades. Excesso de estoque é mantido com aviso para correção; não é descartado silenciosamente. O cupom da conta tem precedência, ou recebe o do visitante quando ausente. A transferência usa marcador de repetição e bloqueio compartilhado com as operações de carrinho. Mais de 50 linhas distintas gera conflito e exige reduzir o carrinho visitante; uma conta criada antes dessa falha pode ser acessada por login após a correção.

Logout remove dados de sessão/carrinho do cache, preservando o carrinho persistido da conta. Expiração remove a credencial local e oferece novo login com retorno à rota pública atual. Respostas 401 só removem o token se ele ainda corresponder à requisição, evitando encerrar uma sessão nova por uma resposta antiga. Carrinhos recebem a credencial capturada na operação e têm caches separados por sessão.

`returnTo` aceita catálogo, carrinho, detalhe de NFT, perfil, carteiras, pagamento e pedido por ID, incluindo query/hash; destinos externos, caminhos de autenticação e caracteres de controle são rejeitados. Perfil e carteiras privados estão descritos abaixo. Checkout e retomada estão descritos na seção correspondente abaixo.

## Perfil e carteiras

Todos os endpoints exigem sessão válida com Bearer. A API responde 401 ao visitante/token expirado. A UI protege `/perfil` e `/carteiras` e preserva o destino no login. Os contratos executáveis estão em `src/shared/contracts/account.ts`.

| Método e recurso | Operação |
| --- | --- |
| `GET /api/profile` | Perfil do usuário atual, com `id` e `version` |
| `PATCH /api/profile` | Atualiza perfil, avatar e, opcionalmente, senha em uma única gravação |
| `GET /api/wallets` | `{ version, primary, secondary, secondarySameAsPrimary }` |
| `PUT /api/wallets/primary` | Cadastra/substitui dados da carteira principal |
| `PUT /api/wallets/secondary` | Cadastra/substitui dados da carteira secundária |
| `PATCH /api/wallets/preferences` | Define `{ secondarySameAsPrimary }` |

GET e mutations retornam ETag com versão entre aspas. Mutations exigem `If-Match`; versão antiga retorna 409 `ACCOUNT_CONFLICT`, ausência/formato inválido 428. A UI preserva o rascunho após conflito e oferece recarregar os dados confirmados. Sem edição local, refetch sincroniza o formulário; durante edição, a versão base permanece aquela carregada inicialmente. Não há retry automático ou confirmação otimista de gravação.

### Perfil

Campos: `name` (2–40), `username` (3–32; letras minúsculas, números, ponto, hífen e sublinhado), `email`, `ens` (nome sem `.eth`, opcional), `walletAlias` (opcional) e `avatar` (data URL PNG/JPEG/WebP ou `null`). E-mail e username são únicos por conta, com conflitos 409. ENS e apelido são metadados; não conectam uma carteira automaticamente.

Avatar: até 200 KB no seletor, data URL limitada a 280 mil caracteres no contrato, imagem decodificável de até 1024 × 1024 px. A prévia e a remoção somente persistem ao salvar. Nenhum upload externo é realizado.

`currentPassword`, `newPassword`, `confirmPassword` são strings vazias quando não há mudança de senha. Quando preenchidas, exige senha atual válida, nova senha de 8–128 caracteres, diferente da atual, e confirmação idêntica. Falha rejeita o perfil inteiro sem gravação parcial. A nova senha recebe outro salt/hash; as demais sessões são revogadas, mantendo a atual. O perfil passa a ser a fonte de nome/e-mail da consulta de sessão, inclusive após novo login.

### Carteiras

Cada slot contém `name`, `alias`, `network`, `profileName`, `address`, `secondaryAddress`, `provider`, `referralCode`, `email`, `ens`. Endereço alternativo, indicação e ENS são opcionais. Rede pode ser `ethereum`, `polygon` ou `solana`; provedores demonstrativos: WalletConnect, MetaMask, Coinbase Wallet. Nesta simulação MetaMask está restrita às redes EVM.

Endereços EVM: `0x` seguido de 40 caracteres hexadecimais. Solana: 32–44 caracteres Base58, com comparação sensível à caixa. Trata-se de validação sintática para dados fictícios; não há consulta de saldo, procedência, checksum ou conexão blockchain. Endereço alternativo aceita o formato da rede ou nome `.eth`.

Endereço/rede repetidos nos dois slots retornam 409 `WALLET_CONFLICT`. Para reutilizar a principal, a preferência exige que ela exista. Enquanto vinculada, a secundária acompanha a principal para uso no checkout; uma secundária independente anterior permanece guardada e reaparece ao desmarcar. A API bloqueia edição do slot secundário enquanto vinculado.

Dados adicionais de perfil são migrados com defaults em contas já existentes. Carteiras ficam em `kurio:wallets:v1:<userId>`. Caches privados usam `['account', token, recurso]`, com credencial capturada na consulta/mutation; logout, expiração e troca de conta cancelam/removem os caches anteriores. Respostas antigas não atualizam a nova sessão.

## Checkout e pedidos simulados

Contratos Zod em `src/shared/contracts/checkout.ts`. Todas as rotas exigem sessão válida. Valores monetários vêm da API como strings decimais; o cliente nunca envia totais para confirmar uma compra.

| Método e recurso | Operação |
| --- | --- |
| `GET /api/checkout` | Dados do colecionador, carteiras, conexão válida, carrinho e ID de pedido pendente |
| `POST /api/checkout/connections` | Simula conexão com `{ walletSlot, network, provider }` |
| `DELETE /api/checkout/connections/:id` | Desconecta a carteira simulada do usuário |
| `POST /api/checkout/quotes` | Revisa `{ name, email, walletSlot, network, provider, connectionId }` e guarda cotação no servidor |
| `POST /api/orders` | Envia `{ quoteId }` com `Idempotency-Key` |
| `GET /api/orders/by-key/:key` | Recupera o pedido da tentativa, inclusive após resposta perdida |
| `GET /api/orders/:id` | Consulta/reconcilia o estado do pedido do usuário atual |

### Conexão e revisão

A conexão tem ID, validade de 10 minutos e vínculo ao usuário, carteira cadastrada, endereço, rede e provedor. Alterar a carteira invalida conexões incompatíveis. A carteira secundária vinculada resolve para os dados da principal. Não há assinatura, extensão ou transação de blockchain real.

Cada pedido precisa conter NFTs de uma única rede, correspondente à carteira. Misturar redes retorna 409 `NETWORK_MISMATCH` e exige separar itens no carrinho; não existe conversão/bridge automático. Colecionador: nome de 2–40 caracteres e e-mail válido, preenchidos inicialmente pelo perfil e editáveis por pedido.

A revisão retorna ID UUID, seleção, validade de 5 minutos e snapshot com colecionador, carteira, itens/quantidades/preços, cupom, subtotal, desconto, taxa e total. A versão do carrinho também integra o snapshot. A API compara o conteúdo atual completo ao revisado antes de criar o pedido. Mudança em itens, preço, estoque, cupom, carteira, conexão ou taxa rejeita o envio com 409 e exige nova revisão explícita. Preço/estoque/cupom com pendência no carrinho exigem correção nele primeiro.

Taxas demonstrativas: Ethereum `0.016`, Polygon `0.003`, Solana `0.001`, todas em ETH conforme o modelo do desafio. `fee-changed` multiplica a taxa por 1,5. Não representam taxas reais de rede nem conversão de SOL. O total usa Decimal.js: subtotal − desconto + taxa.

### Pedido e repetição

`POST /orders` retorna um pedido `pending`, nunca confirmação imediata apenas na UI. O registro contém ID, quoteId, status, datas, motivo de recusa, referência simulada e o snapshot revisado. A chave de idempotência é por usuário; repetir a mesma chave/conteúdo retorna o mesmo pedido. Reutilizar com outro quoteId retorna 409. Uma mesma revisão também gera apenas um pedido quando enviada com outra chave; chaves alternativas ficam associadas ao mesmo pedido para consulta posterior. Há no máximo um pedido pendente por conta.

O cliente persiste `{ key, quote }` em `sessionStorage`, separado por ID de usuário, **antes** do POST. Falha de armazenamento impede um novo envio. Erros de rede/5xx preservam a tentativa: a consulta por chave recupera o resultado, e eventual reenvio explícito mantém a mesma chave/revisão. Erros conhecidos 4xx, exceto 401, liberam o fluxo para nova revisão. 401 mantém a tentativa para retomada após login. POST não usa retry automático.

Consulta por ID/chave de outra conta responde 404. A UI só exibe **Compra confirmada** quando a API retorna `confirmed`; `pending` mostra processamento e `declined` mostra o motivo, preservando o carrinho. Eventos Socket.IO e polling de fallback de 5 s enquanto pendente e refetch no foco/reconexão recuperam o estado após refresh ou falha. Sem conexão, o cliente não inventa confirmação/recusa.

### Estoque, processamento e recibo

Na simulação, pedidos pendentes reservam quantidades por até 10 minutos; confirmados consomem estoque. O resolvedor compartilhado de detalhe/carrinho considera essas reservas em todas as contas. Processamento normal fica elegível após aproximadamente 2,2 s e avança em consultas REST; não há worker/backend externo. Antes de confirmar, revalida conexão, preço, estoque, cupom e taxa. Alterações nessa fase recusam o pedido e exigem nova revisão; itens continuam no carrinho.

O registro de pedidos, cotações e conexões é persistido em uma única chave `kurio:commerce:v1`. As últimas 200 cotações são mantidas; pedidos e suas chaves permanecem para recuperação/idempotência. Recibos usam exclusivamente o snapshot persistido, sem atualizar seus valores a partir do catálogo. A referência `sim-…` é local e não leva a um explorador blockchain real.

Após confirmação, o carrinho subtrai apenas as quantidades compradas, mantendo itens/unidades adicionados posteriormente. Um marcador durável `settledOrders` é salvo junto da subtração no registro do carrinho. Reconsultar o recibo não repete a remoção. O pedido confirmado é salvo antes da limpeza; caso essa gravação do carrinho falhe, uma nova consulta ao pedido/checkout tenta concluir a limpeza com o mesmo marcador. Trata-se de reconciliação entre duas chaves locais, não de uma transação distribuída real.

## Favoritos

`GET /api/favorites` retorna `{ version, ids, items }` da conta atual. `PUT /api/favorites/:nftId` inclui e `DELETE` remove; ambos são absolutos/idempotentes e retornam a lista atual. NFT desconhecido retorna 404; sessão inválida/ausente 401; falha simulada 503. Registros em `kurio:favorites:v1:<userId>`. Imagens/preços são resolvidos a partir do mesmo catálogo atual. A UI faz atualização otimista, cancela consulta anterior e restaura o snapshot em falha; cache privado é limpo na mudança de sessão.

## Eventos Socket.IO

Transporte: WebSocket com Engine.IO v4/Socket.IO; `socket.io-client` e MSW `ws` + `@mswjs/socket.io-binding`. URL padrão é a origem da aplicação, path `/socket.io/`; credencial vai no pacote `auth`, não na URL. O handler considera a normalização de `/socket.io/` para `/` feita pelo MSW. Não há servidor externo/rooms/namespaces na demonstração.

| Evento | Payload |
| --- | --- |
| `nft.updated` | `{ eventId, nftId, version }` |
| `order.updated` | `{ eventId, orderId, owner, version, status }` |
| cliente → `subscribe-order` | `{ orderId }` |

Eventos são sinais de invalidação: valores/confirmacões finais continuam sendo lidos da API canônica. Versões repetidas/antigas não invalidam de novo nem regredem o estado. Pedido terminal não volta a pendente. O servidor valida sessão/owner ao emitir e o cliente descarta mensagens de sessão anterior. Limpeza de listeners, timers e socket ocorre ao desmontar ou trocar sessão/pedido. Reconexão invalida os recursos ativos e faz REST; polling de pedido a cada 5 s é fallback.

O servidor mock reconcilia pedidos inscritos a cada 400 ms e emite versões novas, além dos eventos publicados após mudança de estado. Alterações de inventário incrementam a versão do NFT. `BroadcastChannel` replica notificações entre abas da mesma origem; persistência/bloqueio compartilhados mantêm a fonte REST. Sem backend externo, estado/eventos não se propagam entre dispositivos e dependem de ao menos uma página aberta.

Somente nos mocks, `POST /api/mock/events` aceita atualização `{ type: 'nft', nftId, priceEth?, remaining?, mode? }` ou interrupção `{ type: 'disconnect', durationMs }`. A alteração é persistida em `kurio:marketplace-overrides:v1` antes da emissão; `remaining` afeta a edição padrão e ainda considera estoque reservado/consumido. Modos `duplicate` e `old` emitem sem alterar os dados REST. A interrupção fecha os sockets e simula indisponibilidade temporária no handshake antes de permitir reconexão.
