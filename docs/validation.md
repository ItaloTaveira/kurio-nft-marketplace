# Validação da entrega local

Data: 13/11/2026. A aplicação usa backend REST e Socket.IO simulados no navegador, sem pagamentos reais.

## Auditoria Lighthouse

Medianas de três execuções por página e perfil, em build de produção com mocks ativos. Relatórios HTML/JSON em `lighthouse/reports/mobile` e `lighthouse/reports/desktop`; condições completas em `lighthouse/reports/summary.json`.

| Perfil / página | Performance | Acessibilidade | Boas práticas | SEO | LCP | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile / início | 85 | 100 | 100 | 100 | 3867 ms | 194 ms |
| Mobile / detalhe | 84 | 100 | 100 | 100 | 4093 ms | 165 ms |
| Desktop / início | 100 | 100 | 100 | 100 | 815 ms | 0 ms |
| Desktop / detalhe | 99 | 100 | 100 | 100 | 860 ms | 0 ms |

Ambiente: Apple M1, 8 GB, macOS arm64, Node 22.23.2, Lighthouse 13.6.0, Chromium 158. Mobile usa throttling simulado padrão, CPU 4×, RTT 150 ms e throughput 1638,4 Kbps; desktop CPU 1×, RTT 40 ms e throughput 10240 Kbps. CLS mediano zero, exceto início desktop (0,00016).

A meta de performance mobile de 90 ainda não foi atingida. O carregamento inicial inclui inicialização do service worker, runtime MSW e dados REST antes da renderização do catálogo; o custo aparece no LCP e no bloqueio da thread principal. Foram aplicados WebP (redução aproximada de 93% no conjunto de imagens derivadas), carregamento de rotas sob demanda e antecipação do runtime de mocks. Os mocks foram mantidos para preservar os fluxos auditados. Uma próxima otimização deve reduzir o caminho crítico de inicialização; os resultados atuais não satisfazem esse critério do desafio.

## Verificações

- Build de produção e TypeScript: aprovados.
- Oxlint: aprovado.
- Referências visuais: 12 imagens de início, detalhe, carrinho e pagamento em desktop, tablet e mobile; geração aprovada e imagens representativas revisadas.
- Suíte completa: 183 casos, com 181 aprovados, um ignorado (painel mobile não aplicável ao desktop) e uma falha na automação de clique duplo mobile. O teste disparava cliques por coordenadas durante a mudança de página; passou a disparar ambos no mesmo elemento antes da resposta. A repetição desse cenário nos três perfis aprovou 3/3. Os 182 casos aplicáveis foram, portanto, verificados; não foi repetida toda a suíte após a alteração exclusiva do teste.
- As 12 comparações com as referências visuais também passaram na execução completa. Logs da execução e da repetição estão em `docs/test-runs`; o relatório HTML Playwright corresponde à última repetição.

As referências são da implementação em Chromium/macOS. Elas detectam regressões futuras e não comprovam equivalência ao Figma. A CI executa testes funcionais em Linux; novas referências visuais nesse sistema exigem revisão própria.

## Pendências de entrega

- Repositório remoto: `https://github.com/ItaloTaveira/kurio-nft-marketplace`, privado. Demonstração pública atual: https://kurio-nft-marketplace-gold.vercel.app.
- Revisão integral dos frames de carteiras, checkout e recibo: pendente por limite da cota Starter do MCP Figma.
- Performance mobile: abaixo da meta, conforme números acima.
- A toolchain conserva 15 alertas de dependências de desenvolvimento registrados no README; não foi aplicada atualização forçada.

Atividade, ofertas, suporte, downloads e conteúdo editorial estão fora do escopo do enunciado. OAuth e recuperação de senha permanecem desativados. O backend simulado é apropriado à demonstração e não fornece segurança de servidor ou integração blockchain de produção.

## Verificação do deploy Netlify

Em 13/11/2026, início, detalhe e pagamento responderam HTTP 200 sem bloqueio de acesso da hospedagem. No Chromium, o catálogo apresentou nove cards, o Socket.IO conectou, o detalhe abriu por URL direta e a adição ao carrinho persistiu após refresh. O pagamento sem sessão redirecionou para `/entrar?returnTo=%2Fpagamento`. Esta verificação resumida do deploy não substitui a suíte local nem representa uma nova auditoria Lighthouse em produção.


## Correções após retorno de uso — 13/11/2026

Foram corrigidos o cancelamento do login com retorno privado, os estilos do menu da conta em acesso direto, a reconciliação de carteira/rede no checkout, a taxa simulada por rede e o placeholder mobile. O sufixo ENS deixou de aparentar um seletor. Google, Facebook e recuperação de senha foram removidos por solicitação do usuário. O recibo ganhou composição compacta e fechamento para o carrinho; a ilustração original ainda não está disponível localmente.

Validação focada: 72 casos de conta/autenticação/checkout, 42 de carrinho/tempo real e 13 das novas regressões foram aprovados nos três perfis (127 casos funcionais únicos). Dois casos de fechamento do diálogo são ignorados em tablet/mobile porque o modal é exclusivo do desktop. Nas duas primeiras rodadas, o novo teste de fechamento precisou corrigir o nome do link de saída e aguardar o formulário antes de enviar Escape; passou na repetição final com X, Escape e clique externo. Os logs mantêm essa sequência, sem ocultar as primeiras falhas da automação.

As 15 referências visuais (agora incluindo recibo) passaram na comparação. IDs aleatórios são mascarados nas imagens do recibo e o aviso transitório de atualização é ocultado apenas na captura, por CSS de teste; a operação dos eventos continua coberta nos testes funcionais. As capturas foram revisadas em desktop e mobile. O build, a verificação de tipos e o lint passaram. Não foi refeita a auditoria Lighthouse nesta alteração; as notas anteriores são históricas.

Após o deploy automático do commit `898d4ce`, a suíte das correções foi executada também em https://nft-marketplaceme.netlify.app: 13 casos aprovados e dois ignorados por serem exclusivos do desktop. Foram confirmados no site público o fechamento do login, o menu sobreposto, a remoção das ações indisponíveis, a reconciliação da carteira e as taxas por rede. Evidência em `docs/test-runs/fixes-production.txt`.


## Ajustes visuais pela exportação local — 13/11/2026

A referência e os limites da comparação estão em `docs/design-review.md`. Pagamento, recibo, rodapé e navegação mobile foram revisados; 15 capturas foram geradas e inspecionadas em desktop/mobile. Nome de usuário/metadados de carteira são somente leitura; a observação é validada e preservada no snapshot. Os fluxos de compra, troca de preço, sessão e isolamento de conta foram reexecutados.

A rodada completa local teve 201 casos: 178 passaram de primeira, 13 passaram na repetição, sete falharam e três foram ignorados por não se aplicarem ao viewport. As falhas incluíram expectativas da navegação anterior e um aviso que interceptava o botão de voltar ao carrinho no tablet. Os testes foram adaptados aos controles reais da nova navegação, e o aviso foi corrigido. Também foi ajustada a incorporação da resposta da conexão ao cache para evitar estado visual antigo. As repetições focadas e seus resultados finais ficam nos logs `docs/test-runs/layout-*`; não se apresenta essa primeira rodada como uma suíte integralmente aprovada. Não foi refeita a auditoria Lighthouse.


## Migração de hospedagem

O usuário migrou a demonstração para https://kurio-nft-marketplace-gold.vercel.app. Os registros anteriores da Netlify são históricos. O HTML da Vercel foi conferido e referencia o mesmo bundle do build local dos ajustes visuais. A primeira CI desses ajustes aprovou 180 casos funcionais e falhou em três execuções do teste de favoritos por uma alteração incorreta no próprio teste (referência ao recibo fora do seu cenário); o teste foi corrigido, preservando a verificação de isolamento entre usuários.

A correção do teste de favoritos passou nos três perfis Chromium (3/3). No endereço da Vercel foram verificados catálogo com nove cards, rodapé desktop, acesso direto ao detalhe, proteção e cancelamento do pagamento, cinco links na navegação mobile e apenas uma imagem no banner mobile. Não foram capturados erros JavaScript nessa verificação resumida.


## Login social simulado

Google e Facebook foram reintroduzidos com aviso explícito de demonstração, sem OAuth ou acesso a contas reais. A validação focada aprovou seis casos sociais nos três viewports, além dos 13 casos aplicáveis das regressões existentes. A primeira rodada do novo teste de troca de provedor navegava antes da conclusão do logout; após aguardar a confirmação da saída, a repetição passou em 6/6 sem retries. A interface desktop foi inspecionada por captura; build, TypeScript e lint passaram. Evidência em `docs/test-runs/social-demo-final.txt`.


## Abertura do login sem reconstruir o fundo

Foram aprovados 49 testes de início, autenticação, simulação social e regressões em desktop/tablet/mobile (dois casos exclusivos do desktop ignorados nos demais perfis). O novo teste da transição verifica que o elemento original da página permanece conectado ao DOM ao abrir e fechar o modal, os filtros são mantidos e há apenas uma requisição de documento. Ele se aplica ao desktop; mobile utiliza uma tela própria. Build e lint passaram. As auditorias Lighthouse não foram refeitas nesta alteração.
