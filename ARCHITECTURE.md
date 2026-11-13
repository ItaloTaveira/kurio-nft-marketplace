# Arquitetura inicial

## Limites

As etapas atuais incluem cabeçalho, banner responsivo, catálogo, detalhe do NFT, carrinho, rota inicial e página 404. O catálogo usa contratos compartilhados, provider Query, Axios e endpoint MSW. Mutations do carrinho estão implementadas. Login, cadastro e sessão estão implementados; perfil e carteiras estão implementados; eventos permanecem pendentes.

## Organização

Cada funcionalidade fica em `src/features/<feature>`. Arquivos como `api.ts`, `queries.ts`, `schemas.ts`, `components/` e `hooks/` serão criados apenas conforme a necessidade. As rotas compõem funcionalidades; `shared` não importa funcionalidades; a aplicação não acessa o banco dos mocks diretamente.

## Decisões para a implementação

- TanStack Router controla rotas, parâmetros da URL e proteção dos fluxos privados.
- TanStack Query controla dados remotos, mutations e sincronização; chaves privadas incluem identidade do usuário.
- Axios concentra chamadas REST e tratamento de erros de transporte.
- Estado temporário de interface fica no React.
- MSW intercepta a rede; fixtures, persistência e reset ficam exclusivamente nos mocks.
- Eventos passam pelo cliente Socket.IO e pela integração `@mswjs/socket.io-binding`. MSW permanece na versão 2 compatível com essa integração.
- REST e eventos compartilham contratos tipados em `shared/contracts`.
- ETH trafega como string decimal; `decimal.js` está disponível para cálculos precisos.
- Logout deverá limpar cache privado e subscriptions; reconexão deverá reconciliar dados por REST.

Políticas detalhadas de cache, retries, sessão e idempotência serão definidas junto aos contratos. A navegação usa TanStack Router com árvore de rotas declarada em código; o catálogo usa dados remotos através de Query e Axios.

## Fidelidade visual e limites da primeira etapa

As cores e a família Roboto Mono foram extraídas do Figma. O conteúdo usa largura máxima de 1200 px no desktop e margens de 24 px no mobile. A composição mobile é própria, conforme o frame de 414 px, com adaptação para 390 px. Tablet usa uma adaptação intermediária, pois não há frame dedicado.

As imagens e os SVGs foram baixados das respostas de contexto dos nós `70353:242` e `14:5226` da cópia autorizada `dYsbsf4GJRTfYocr2lo3Du`. Não há URLs temporárias do Figma na execução da aplicação. Os PNGs originais foram preservados e têm versões WebP geradas para execução, conforme a seção de fechamento.

A contagem do carrinho vem da API e representa a soma das unidades. Login, cadastro e favoritos estão ativos. O catálogo já está ativo. Os links editoriais fora do escopo não disparam ações. Não há confirmação visual de operações ainda não implementadas.

## Estado remoto do catálogo

A chave de cache é `['catalog', search]`, incluindo todos os parâmetros normalizados e listas ordenadas/sem duplicatas. O stale time é de 30 segundos e o garbage collection de 5 minutos. Não há retry automático: falhas apresentam um botão explícito de recuperação. O foco da janela não dispara refetch; reconexão mantém o comportamento padrão de revalidar dados obsoletos.

O AbortSignal do Query é passado ao Axios (timeout de 8 segundos). Consultas obsoletas são canceladas e não atualizam uma busca nova. Ao mudar parâmetros sem cache, a grade volta aos skeletons, sem exibir resultados de filtros anteriores. Revalidação da mesma chave mantém os dados e informa atualização; falha nessa revalidação mantém os dados com aviso. Não há dados privados nesta etapa.

Preço é string decimal nos contratos e na URL. O parser da aplicação preserva escala e 18 casas, evitando a conversão automática de JSON para ponto flutuante. Apenas o slider usa inteiros de centésimos, convertidos por Decimal.js. Os campos de texto permitem precisão maior. Campos explícitos e checkboxes complementam o Figma para melhorar teclado, foco e seleção múltipla.

## Ajustes visuais e pendências

- Ordenação mobile fica no painel de filtros para manter o alinhamento da grade do frame.
- A seleção de filtros usa contagens reais das 36 fixtures. Não copia as quantidades ilustrativas do mockup.
- Os nomes e preços mobile seguem os mesmos NFTs do desktop; os rótulos repetidos do frame mobile não foram usados para nomear imagens diferentes. O card sem título no desktop recebeu o nome fictício Golden Echo #208.
- Favoritos mobile têm indicação de indisponibilidade e aguardam o fluxo autenticado.
- As três colunas no tablet são uma adaptação, sem frame específico.
- Não há baselines de regressão visual ou auditorias Lighthouse finais. O bundle principal e as imagens originais ainda precisam de otimização.
- A revisão encontrou um recorte preexistente da primeira linha do banner em 390 px, que deverá ser tratado ao revisar o banner; esta etapa alterou apenas a área do catálogo e os controles de busca/filtros.

## Detalhe do NFT

A rota pública `/nfts/$nftId` usa a chave Query `['nft', nftId]` e compartilha a política de cache do catálogo. Axios recebe o AbortSignal e valida o contrato por Zod. Fixtures e estados de disponibilidade continuam exclusivamente na camada MSW. O endpoint fornece as edições, preços por edição, estoque e limite por pedido.

Seleção de edição e quantidade são estado de navegação. Uma quantidade restaurada maior que o estoque/limite é reduzida por replace na URL, sem criar entrada extra no histórico. Alterações manuais respeitam inteiros positivos; a edição muda a quantidade para 1. Um identificador de edição válido no formato, mas inexistente, gera estado explícito sem selecionar silenciosamente outra edição.

O parâmetro de retorno aceita apenas o catálogo e preserva seus filtros. A galeria mantém estado local e usa Dialog/RadioGroup do Radix, com contenção/retorno de foco e seleção por teclado. Avaliações são dados de demonstração; o agregado deriva das 19 fixtures, e o botão de expansão apenas revela registros já recebidos da API.

### Fidelidade e adaptações

- Galeria desktop com miniaturas laterais e detalhe mobile com folha sobreposta e barra inferior fixa. O zoom também está disponível no mobile, onde ficam as miniaturas.
- O Figma repete a mesma arte nas quatro miniaturas; não foram inventadas vistas alternativas.
- O mockup mobile repete o rótulo 1/10. A implementação usa os IDs/labels consistentes da API: 1/1, 1/10, 1/50 e aberta.
- Edições esgotadas ficam desativadas. Limites e indisponibilidade têm feedback próprio.
- Contrato e direitos autorais aparecem com seus rótulos correspondentes; o texto do frame apresentava essas duas informações invertidas.
- O botão de compra adiciona a seleção ao carrinho e navega para ele. Favoritos estão ativos e checkout simulado foi acrescentado na sétima etapa; não há confirmação de pedido simulada apenas na interface.
- Footer compartilhado e otimizações finais de performance/SEO ainda estão pendentes. Não há baselines visuais versionadas nesta etapa.

## Carrinho: persistência, cache e concorrência

A chave Query é `['cart', token || 'guest']`, com stale time de 5 segundos e revalidação ao montar ou voltar à janela. Enquanto uma mutation está ativa, consultas ficam desabilitadas e requisições anteriores são canceladas. As mutations compartilham um scope de serialização; após concluírem, o carrinho é revalidado por REST. Respostas com versão anterior à do cache não substituem uma versão mais recente.

A remoção atualiza otimisticamente itens/contador. O snapshot anterior é restaurado se a mutation falhar e nenhuma resposta mais recente tiver avançado a versão. Totais monetários não são recalculados na UI: ficam mascarados durante operações e são substituídos pelo resumo da API. Falhas mantêm itens, cupom válido e dados persistidos.

A camada de mocks guarda apenas referências a NFT/edição, quantidade, preço aceito, cupom, versão e as 100 últimas chaves de adição em `kurio:guest-cart:v1`. Imagens e valores atuais são derivados do mesmo resolvedor usado no catálogo/detalhe. `Web Locks` serializa read-modify-write entre abas em ambientes compatíveis; há fallback de fila por contexto. Sem Web Locks, a exclusão mútua entre abas não é garantida. A UI ainda não escuta mudanças de outra aba; revalida no foco e trata conflito de versão com feedback e nova consulta.

Alterações usam ETag/If-Match, e adições usam chave de idempotência e preço esperado. Dados salvos corrompidos ou incompatíveis com as fixtures são reinicializados para um carrinho vazio conhecido. Storage indisponível gera falha visível, sem confirmação falsa de gravação.

O carrinho oferece armazenamento separado por usuário e por visitante. A etapa de autenticação, descrita abaixo, inclui mesclagem do visitante e cache separado por sessão.

### Adaptações do layout do carrinho

- A grade desktop e os cards mobile usam os mesmos dados, sem replicar quantidades incompatíveis com estoque/limite do mockup.
- O mobile oferece remoção explícita em todas as linhas e apresenta a edição correta.
- O subtotal da fixture mobile do Figma é inconsistente com suas linhas. O valor exibido vem da soma decimal na API.
- O atalho de carrinho foi acrescentado ao cabeçalho mobile enquanto a navegação inferior ainda está pendente.
- A taxa demonstrativa depende da rede: Ethereum 0.016, Polygon 0.003 e Solana 0.001, todas em ETH equivalente. Carrinhos mistos usam a maior taxa como estimativa; o checkout exige uma única rede e revalida sua taxa. Não é uma estimativa de blockchain real. Checkout revalida taxa/rede/carteira na sétima etapa abaixo.
- O resumo permite aceitar novos preços, mas não aceita automaticamente estoque insuficiente nem remove itens para corrigir conflitos.

## Quinta etapa: autenticação simulada

Login/cadastro reutilizam os tokens, Button, cabeçalho, banner e catálogo existentes. A composição desktop usa Radix Dialog com foco contido e Escape/fechamento; mobile/tablet usa página de formulário. React Hook Form e Zod validam os campos, e os handlers repetem a validação. Ícones originais de senha, fechar e provedores estão locais. A página de fundo reutiliza o marketplace existente; suas diferenças preexistentes em relação à instância estática do Figma não foram reproduzidas. O atalho de conta mobile foi acrescentado ao cabeçalho e ao carrinho enquanto a navegação inferior está pendente.

`features/auth` contém chamadas/mutations de sessão, ciclo de expiração e controles de conta. `shared/api/session-token.ts` guarda a credencial da aba e notifica mudanças; Axios envia Bearer e descarta a credencial atual em 401 correspondente. Sessão é recuperada via REST ao montar e revalidada no foco; não há subscriptions de conta implementadas ainda. Token em sessionStorage mantém refresh e permite contas independentes em abas; revogação em outra aba é detectada na próxima consulta protegida/revalidação de foco.

Há armazenamento por usuário, transferência do visitante ao autenticar e caches por token. Logout/troca/expiração cancelam consultas e removem o cache anterior. Respostas tardias de mutations não reintroduzem dados de outra sessão; cada chamada de carrinho carrega sua credencial capturada. Formulários de conta e logout aguardam mutations de carrinho em andamento. O bloqueio de persistência compartilhado serializa conta/mesclagem e carrinho entre abas compatíveis.

Contas e sessões do servidor simulado usam localStorage; hashes PBKDF2 com salt evitam senha em claro. Sessão dura uma hora. Essa infraestrutura é demonstrativa para o desafio. OAuth e recuperação de senha foram removidos da interface; o acesso usa e-mail e senha na API simulada. Perfil/carteiras foram acrescentados na sexta etapa abaixo.

## Sexta etapa: perfil e carteiras

`features/account` separa transporte, consultas/mutations e composição compartilhada das páginas. `routes/profile-page.tsx` e `wallets-page.tsx` usam React Hook Form/Zod com feedback da API e preservação do rascunho nas falhas. Skeletons ocupam os campos durante a primeira leitura. A barra lateral e os ícones originais vêm da referência de perfil; o mobile/tablet adapta a navegação para links acima dos formulários, sem frame específico no arquivo.

As rotas privadas redirecionam visitantes antes de carregar a página e verificam a sessão no componente de proteção. Expiração durante edição remove a página privada e leva ao login com o destino anterior; o rascunho não confirmado não é persistido entre sessões. Dados já confirmados permanecem no servidor simulado. O guard restringe o redirecionamento ao pathname privado para não substituir `returnTo` durante a montagem da página de login.

O perfil reside no registro de usuário existente, com defaults para contas anteriores. Username e e-mail são únicos. Atualização de perfil/senha é atômica na simulação: primeiro valida senha e avatar, depois salva o registro completo sob o bloqueio compartilhado. Troca de senha mantém a sessão atual e revoga as outras. Não há senha em claro persistida. Avatar é uma pequena data URL validada/decodificada, sem upload remoto.

Carteiras são referências demonstrativas separadas por usuário, com um slot principal, outro secundário e preferência de compartilhamento. Não há integração blockchain ou conexão de extensão. Informações opcionais (ENS, apelido no perfil e indicação) não são obrigatórias apesar dos asteriscos ilustrativos do mockup. Duplicar endereço/rede em slots independentes é conflito; compartilhar exige a opção explícita. A carteira secundária independente é preservada enquanto a preferência está ligada.

ETag/If-Match protege gravações concorrentes. A versão base acompanha o formulário enquanto ele está sem edição, mas fica preservada ao editar. Conflitos não substituem campos digitados; o usuário pode recarregar os dados confirmados. Caches usam `['account', token, 'profile' | 'wallets']`. Consultas e mutations carregam sua credencial capturada; respostas de sessões anteriores não atualizam a sessão atual. O ciclo de sessão cancela/remove dados privados ao sair, expirar ou trocar de conta.

O MCP devolveu contexto detalhado e screenshot do perfil, mas atingiu o limite Starter na consulta do frame de carteiras. A implementação de carteiras usa a biblioteca visual existente e o contrato funcional do desafio; a fidelidade ao frame completo ainda precisa de revisão quando o acesso estiver disponível. Perfil foi conferido contra a referência recebida. Elementos de conta ainda não implementados permanecem desativados: atividade, ofertas, downloads e suporte. Checkout/conexão simulada foram acrescentados na sétima etapa abaixo.

## Sétima etapa: checkout e pedidos

`features/checkout` contém contratos de transporte, consultas/mutations, persistência da tentativa e componentes de resumo/layout. `/pagamento` coleta nome/e-mail, seleção de carteira/rede/provedor e conexão simulada, em seguida oferece revisão explícita da API e confirmação. `/pedidos/$orderId` representa os estados pendente, confirmado e recusado usando o snapshot persistido. A rota é o recibo recuperável após refresh; o histórico/listagem geral de pedidos ainda não foi implementado.

O guard de sessão e o destino seguro de login foram ampliados para checkout e pedidos. Recursos privados continuam sob `['account', token, …]`, sendo cancelados/removidos em logout, expiração e troca de conta. A tentativa usa chave por ID de usuário no sessionStorage para sobreviver a um novo token de login. O preenchimento válido também é preservado por usuário na mesma aba. Formulários e logout ficam bloqueados durante a mutation de envio; páginas de processamento permitem sair, pois o pedido já está persistido. A etapa final acrescentou Socket.IO; polling/refetch REST permanecem como fallback.

A API guarda revisão e pedido; a UI não calcula o total final nem aceita valores monetários enviados pelo cliente. Cada revisão dura 5 minutos e vincula carteira/conexão, coletor, itens, quantidades, cupom e taxa. O envio compara o snapshot atual inteiro ao revisado. Pedidos só confirmam após outra revalidação durante o processamento. Mudanças antes do envio exigem corrigir/revisar novamente; mudanças durante processamento recusam o pedido sem remover itens.

`commerce-store.ts` persiste cotações, conexões e pedidos no ledger local. Mutations usam o mesmo Web Lock de carrinho/conta, com fallback de fila por contexto; a limitação de exclusão entre abas sem Web Locks continua aplicável. Pedidos pendentes reservam estoque por 10 minutos e confirmados o consomem, derivados no resolvedor compartilhado de detalhe e carrinho. Estados avançam em consultas REST após o prazo simulado; não existe serviço de processamento independente quando o aplicativo está fechado.

A identificação da tentativa é persistida antes do envio. Chave/conteúdo iguais e uma mesma revisão não geram pedidos adicionais, mesmo com resposta perdida ou nova chave associada à revisão. O cliente consulta por chave antes de permitir outra compra e mantém a mesma identificação em reenvio explícito. Não há retry automático do POST. O ledger é gravado antes da limpeza do carrinho; marcador durável no carrinho e reconciliação nas próximas consultas tornam a subtração repetível após falha parcial, preservando unidades extras adicionadas enquanto o pedido estava pendente. Não há promessa de atomicidade entre duas chaves localStorage.

O recibo não consulta preços atuais para reconstruir valores. Referências `sim-…` e provedores são demonstrativos, sem links que aleguem transação real em exploradores. Um pedido deve ter uma única rede compatível com a carteira; não há bridge automático para o carrinho com redes mistas. Todas as taxas/valores continuam em ETH no modelo do desafio, inclusive na simulação de Solana.

A tentativa de consultar o frame de pagamento foi bloqueada pela cota Starter do Figma. Checkout/recibo usam a biblioteca de componentes e tokens existentes e os requisitos funcionais do desafio; a comparação visual com os frames completos permanece pendente. A revisão manual confirmou responsividade, imagens e ausência de erros nas quatro larguras. O restante da navegação ainda pendente (atividade/histórico geral, ofertas, downloads, suporte e OAuth/recuperação de senha) permanece identificado como tal.

## Fechamento funcional e verificação

Favoritos (`features/favorites`) usam endpoints idempotentes e cache privado de Query com atualização otimista, rollback e feedback persistente na lista após desmontar o card removido. Consulta, inclusão e remoção exigem sessão; visitantes vão ao login e retornam à rota anterior, sem mutation automática ao autenticar. A sidebar/menu e a navegação mobile dão acesso à lista.

Socket.IO é efetivamente exercitado pelo cliente. O mock faz handshake Engine.IO/Socket.IO, valida o pacote auth, mantém inscrição no pedido atual e emite notificações versionadas. O cliente invalida recursos REST em eventos válidos e reconcilia após reconectar; não aplica valores de negócio diretamente do evento. Emissão de pedido ocorre após persistência e o recibo espera confirmação REST. Eventos privados são filtrados no servidor e no cliente; efeito libera listeners/socket ao trocar de sessão ou pedido. Polling de 5 s permanece como fallback, não como substituto do transporte de eventos.

`marketplace-events.ts` guarda overrides versionados e publica depois de persistir. Preço/estoque afetam catálogo, detalhe, carrinho e validação da cotação. Reservas/consumo de pedidos também emitem atualização de inventário. A simulação é local ao navegador/origem, com BroadcastChannel entre abas; não substitui um servidor distribuído. O MSW normaliza o path Socket.IO na comparação do handler. Testes verificam reconexão pelo cliente após indisponibilidade de handshake.

A navegação inferior mobile usa componentes/ícones existentes. A barra fixa de compra no detalhe fica acima dela, com espaço de conteúdo e safe area. Atividade, ofertas, suporte e downloads permanecem fora do escopo, conforme enunciado; a indicação anterior de que seria obrigatório construir histórico/atividade foi corrigida. OAuth e recuperação de senha foram removidos da interface.

PNG originals são preservados e o script Sharp gera WebP qualidade 88, sem alterar dimensões. A soma dos arquivos derivados caiu de 15.684.728 para 1.045.190 bytes (aproximadamente 93%); o Vite ainda deduplica assets idênticos. Rotas de conta/detalhe/carrinho/checkout e o cliente de eventos carregam sob demanda; o build não precisa mais de um chunk principal acima de 500 kB. Inicialização de mocks e worker ocorre em paralelo antes das consultas, com prioridade para a imagem principal. Não há otimização exclusiva para a auditoria nem desativação de mocks/imagens/tempo real.

Dois usuários fictícios são criados de forma repetível sem apagar contas existentes. Setup/testes, falhas, eventos, reset e publicação estão documentados. Configurações Vercel/Netlify fornecem fallback SPA e a CI prepara Chromium e testa os fluxos. Repositório e URL pública ainda dependem de destino informado pelo usuário; nenhuma publicação foi feita. A revisão completa dos frames inacessíveis continua limitada pela cota do Figma, e os resultados efetivamente medidos são registrados em `docs/validation.md`.


## Correções após teste de uso

- Cancelar autenticação com retorno privado leva ao carrinho público, evitando o ciclo de reabrir o login. X, Escape e clique externo usam o mesmo caminho.
- O CSS do menu da conta é importado pelo próprio componente, inclusive em acesso direto/refresh de perfil. O painel é absoluto e não aumenta o cabeçalho.
- O sufixo ENS `.eth` é texto fixo, sem seta que sugira um seletor inexistente. A busca mobile usa o placeholder curto “Buscar NFTs”.
- Salvar perfil/carteiras invalida o contexto do checkout. Mudanças nas carteiras reconciliam rede/provedor no formulário e no rascunho, preservando itens do carrinho. Incompatibilidades reais entre rede da carteira e NFTs permanecem bloqueadas com explicação; não há bridge fictício.
- Carrinho e checkout compartilham as taxas simuladas por rede. ETH é a moeda de cotação, inclusive para valores equivalentes das outras redes, explicitados na estimativa.
- Recibo confirmado tem composição mais compacta, fechamento para o carrinho e borda inferior na cor principal. Preserva dados reais do snapshot e a indicação de transação simulada. A ilustração original “Thank you” não está disponível entre os assets locais; mantém-se o indicador de confirmação existente, sem afirmar fidelidade integral ao frame.
- Google/Facebook e recuperação de senha foram removidos a pedido do usuário; não foram substituídos por autenticação social fictícia.


## Revisão visual com exportação local do Figma

A exportação recebida pelo usuário permite comparar os frames sem a integração MCP. Referência, escopo, diferenças intencionais e assets ausentes estão documentados em `docs/design-review.md`. O rodapé é compartilhado apenas nas rotas que o desenham, com links funcionais de perfil/favoritos/coleções. Recursos editoriais e newsletter não simulam sucesso. A navegação mobile mantém nomes acessíveis e oculta legendas visuais, usando os SVGs de carrinho e usuário da exportação. Sua ação central leva ao mercado; não é uma leitura de carteira ou scanner real.

No pagamento, dados de perfil e carteira são consultados em suas APIs e exibidos como somente leitura; há links para as telas de edição. Dados do colecionador e rede/provedor permanecem validados. Em mobile, os campos ficam em uma seção expansível, aberta automaticamente quando a validação falha; desktop mantém o formulário aberto. A observação opcional de até 1000 caracteres participa da revisão e é copiada ao snapshot da compra. O recibo conserva os valores e a observação após refresh. Não houve integração real com blockchain, newsletter ou autenticação social.

Ao conectar ou desconectar, o checkout incorpora a resposta confirmada da API ao contexto do Query e depois revalida por REST. Essa atualização é posterior à confirmação da API, não uma conexão otimista. Avisos Socket.IO não interceptam cliques nos controles; nas telas de pedido aparecem no topo.
