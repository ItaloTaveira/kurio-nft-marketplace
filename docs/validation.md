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

- Repositório remoto: `https://github.com/ItaloTaveira/kurio-nft-marketplace`, privado. Demonstração pública: https://nft-marketplaceme.netlify.app.
- Revisão integral dos frames de carteiras, checkout e recibo: pendente por limite da cota Starter do MCP Figma.
- Performance mobile: abaixo da meta, conforme números acima.
- A toolchain conserva 15 alertas de dependências de desenvolvimento registrados no README; não foi aplicada atualização forçada.

Atividade, ofertas, suporte, downloads e conteúdo editorial estão fora do escopo do enunciado. OAuth e recuperação de senha permanecem desativados. O backend simulado é apropriado à demonstração e não fornece segurança de servidor ou integração blockchain de produção.

## Verificação do deploy Netlify

Em 13/11/2026, início, detalhe e pagamento responderam HTTP 200 sem bloqueio de acesso da hospedagem. No Chromium, o catálogo apresentou nove cards, o Socket.IO conectou, o detalhe abriu por URL direta e a adição ao carrinho persistiu após refresh. O pagamento sem sessão redirecionou para `/entrar?returnTo=%2Fpagamento`. Esta verificação resumida do deploy não substitui a suíte local nem representa uma nova auditoria Lighthouse em produção.
