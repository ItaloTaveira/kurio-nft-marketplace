# Revisão visual a partir da exportação do Figma

Referência recebida em 13/11/2026: `Frontend Challenge (Copy).zip`, contendo um PNG de 8000 × 7453 px com frames desktop e mobile e seis SVGs. O PNG original é preservado em `design-reference/figma-export.png` para consulta. O arquivo completo não é usado como imagem da interface.

## Ajustes aplicados

| Área | Referência / ajuste |
| --- | --- |
| Rodapé desktop | Blocos W/C/D e newsletter, faixa de marca/contato e colunas de perfil, ajuda, coleções e redes. Compartilhado por início, detalhe, carrinho e pagamento; ausente nos frames de conta e no recibo. |
| Navegação mobile | Barra arredondada, ícones sem legendas visuais e ação central elevada. Links conservam nomes acessíveis. Ícones de carrinho e usuário usam os SVGs recebidos. A barra não ocupa as telas de detalhe, carrinho, pagamento e recibo, que possuem ações próprias. |
| Banner mobile | Altura se adapta ao texto para evitar cortar o título ou a saudação em 390 px. Miniatura permanece removida por solicitação do usuário. |
| Pagamento desktop | Coluna do perfil de 764 px e resumo de 404 px em conteúdo de 1200 px; campos reorganizados na ordem da referência, dados de carteira e ENS visíveis, observação do colecionador e seleção/conexão antes de confirmar. |
| Pagamento mobile | Dados do colecionador em seção expansível e seleção de carteira em destaque. Erros de formulário abrem a seção de dados para correção. |
| Recibo | Painel central de 580 px, afastamento superior de 160 px no desktop, faixa de quatro colunas, tabela de NFTs/edições/subtotal e borda inferior na cor principal. Dados complementares ficam em uma seção expansível. |
| Carrinho mobile | Controle da conta deixa de ocupar uma linha separada entre o título e os itens. |

## Diferenças intencionais e limites

- Login social, recuperação de senha e miniatura sobreposta foram removidos a pedido do usuário, mesmo aparecendo na referência.
- A confirmação somente aparece após a API simulada retornar `confirmed`; quantidades, preços, datas e carteira vêm do snapshot real da simulação, sem copiar valores ilustrativos do frame.
- Nome de usuário e metadados da carteira no pagamento são somente leitura e possuem links para edição nas telas correspondentes. Nome/e-mail do colecionador e seleção de rede/provedor conservam validação. Campos opcionais não são apresentados como obrigatórios.
- Conexão da carteira, revisão explícita, erros e recuperação continuam acessíveis, ainda que acrescentem controles que o frame estático não desenha. A observação é persistida na cotação e no recibo.
- A newsletter e o conteúdo editorial/ajuda/redes sociais do rodapé são apresentados sem simular inscrição ou navegação para páginas inexistentes. Coleções, perfil e favoritos possuem links reais para fluxos implementados.
- A ilustração “Thank you” não veio como asset individual no ZIP. O SVG `Desktop /Message.svg` é um envelope simples branco e não corresponde à ilustração; não foi usado como substituto nem recortado do PNG. O indicador de confirmação anterior permanece. Home/favoritos/ação central usam ícones da biblioteca existente onde não há exportação individual correspondente. As marcas sociais do rodapé são abreviações, não os ícones originais.
- O escopo desta revisão é pagamento, recibo, rodapé e navegação mobile, além dos ajustes de enquadramento relacionados. Seções editoriais de início, páginas fora do escopo e diferenças restantes nas demais telas não foram tratadas como aprovadas por equivalência.

Não se declara equivalência integral ou pixel a pixel ao arquivo Figma. As capturas Playwright verificam estabilidade da implementação revisada e devem ser comparadas à exportação acima para avaliar fidelidade.
