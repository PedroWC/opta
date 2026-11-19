# Auditoria final de acessibilidade e usabilidade (issue #30)

> **Status:** parte automatizada e revisão heurística **concluídas**; teste com leitor de tela e com 5 pessoas **pendentes** (exigem pessoas e dispositivos reais). Plano de pesquisa: [pesquisa-com-usuarios.md](pesquisa-com-usuarios.md). Requisitos: RNF-09, RNF-10, US-09.

## 1. O que foi verificado e como

| Verificação | Critério | Como | Resultado |
|---|---|---|---|
| Violações automáticas | WCAG 2.0 a 2.2 A e AA | `axe-core` no jsdom (`web/src/**/*.test.tsx`) e **no navegador real**, com layout e cores (`web/e2e/acessibilidade-e-responsividade.spec.ts`), em todas as telas, inclusive resultado com gráfico e memória aberta | Sem violações |
| Contraste de cor | 1.4.3, 1.4.11 | Teste de contraste lendo os tokens, nos temas claro e escuro (`web/src/styles/tokens.test.ts`) e axe real | Todos os pares passam |
| Tamanho dos alvos | 2.5.8 (24 px) e meta de 44 px | `web/e2e/auditoria.spec.ts`: mede todo controle visível, no desktop e no celular | Passa (links dentro de frases têm a exceção "inline" da norma) |
| Foco visível e não obscurecido | 2.4.7, 2.4.11 | Percorre cada tela com Tab e confere o contorno de foco (≥ 2 px) e que o elemento está na área visível | Passa |
| Reflow e zoom | 1.4.10, 1.4.4 | Sem rolagem horizontal em 320 px e com zoom de 200% e 400% (janela de 640 e 320 px); inclui fonte larga forçada | Passa |
| Espaçamento de texto | 1.4.12 | Aplica os valores da norma e confere que nada estoura nem é cortado | Passa |
| Teclado | 2.1.1, 2.4.1, 2.4.3 | Pular link como primeiro Tab, formulário e combobox completos pelo teclado, abas por setas, foco no `h1` ao concluir | Passa |
| Estrutura | 1.3.1, 2.4.2, 3.1.1 | Landmarks, títulos sem saltos, `lang="pt-BR"`, título por página, árvore de acessibilidade da tela inicial (`toMatchAriaSnapshot`) | Passa |
| Movimento | 2.3.3 (boa prática) | Com `prefers-reduced-motion`, nenhuma transição passa de 1 ms | Passa |
| Impressão | Wireframe, seção "Imprimir" | Sem navegação nem botões; memória de cálculo expandida em `beforeprint` | Passa (corrigido nesta issue) |

Nesta mesma etapa, os E2E da issue #29 já tinham revelado e corrigido: foco do resumo de erros roubado pelo React Hook Form, foco inicial roubado em StrictMode, abas e layout estourando 320 px.

## 2. Achados e correções desta auditoria

| # | Achado | Gravidade | Correção | Situação |
|---|---|---|---|---|
| A1 | Links do rodapé com 17 px de altura (abaixo dos 24 px da WCAG 2.5.8 e dos 44 px do projeto) | Média | `min-height` de 44 px nos links do rodapé | Corrigido |
| A2 | A memória de cálculo não saía expandida na impressão (itens `details` fechados) | Média | `beforeprint`/`afterprint` abrem todos os anos; teste unitário e E2E | Corrigido |
| A3 | Siglas CBS, IBS e DAS sem explicação nas dicas do formulário (heurística 2, "linguagem do usuário") | Baixa | `abbr` com o significado na primeira ocorrência | Corrigido |
| A4 | Nada impedia o engano comum de digitar a folha maior que a receita (heurística 5, prevenção de erros) | Baixa | Aviso em região `status`, sem bloquear o envio | Corrigido |

## 3. Revisão heurística (Nielsen) das telas

| Heurística | Avaliação | Observação |
|---|---|---|
| 1. Visibilidade do estado | Boa | Esqueleto e "Calculando 8 anos e 3 regimes…", botão "Simulando…", versão das premissas no rodapé, aviso de offline |
| 2. Linguagem do usuário | Boa, com ressalva | Textos simples e com exemplos; siglas explicadas (A3). Os termos "RBT12" e "Fator R" aparecem só na Metodologia e na dica do Fator R |
| 3. Controle e liberdade | Boa | "Ajustar dados" sem redigitar, link compartilhável, botão Voltar funciona porque o estado está na URL |
| 4. Consistência | Boa | Mapeamento único de regime para rótulo, marcador e cor; um único painel de erro |
| 5. Prevenção de erros | Boa | Validação por campo, exemplo preenchido, B2B com complemento B2C, aviso de folha maior que receita (A4) |
| 6. Reconhecimento em vez de memória | Boa | Combobox com busca por código ou texto e cartão da atividade; dicas sob os campos |
| 7. Flexibilidade e eficiência | Boa | Teclado completo, exemplo, link, tabela no lugar do gráfico |
| 8. Estética e minimalismo | Boa | Recomendação primeiro, detalhe sob demanda (memória de cálculo) |
| 9. Recuperação de erros | Boa | Resumo com foco e links; mensagens por código (SIM-001 a SIM-004, rede, 5xx); dados preservados |
| 10. Ajuda e documentação | Aceitável | Metodologia com fontes, limites e glossário; falta ajuda contextual para "ICMS/ISS" além da dica sob o campo |

## 4. Limitações conhecidas (declaradas ao usuário)

- Acima de R$ 3,6 milhões o ISS/ICMS saem do DAS e não são calculados; a API avisa e a Metodologia explica.
- Comércio não tem Simples Nacional nesta versão (Anexo I fora do MVP); o cartão da atividade e o aviso por regime dizem isso.
- Tema escuro só tem os tokens (sem interface para ativá-lo); idioma só PT-BR.

## 5. Pendências que dependem de pessoas e dispositivos (não executadas)

1. **Leitor de tela real:** percorrer o fluxo da US-01 com VoiceOver (Safari, macOS e iOS) e NVDA (Firefox ou Chrome, Windows), conferindo o anúncio do resumo de erros, do combobox, do resultado pronto e da tabela equivalente ao gráfico. O comportamento esperado está coberto por testes de papéis, nomes e regiões `status`, mas o anúncio real varia por leitor.
2. **Teste de usabilidade com 5 pessoas** do público-alvo (empresário e contador), seguindo o roteiro de [pesquisa-com-usuarios.md](pesquisa-com-usuarios.md), com tarefas da US-01, US-02 e US-07, e métricas de conclusão e tempo.
3. **Dispositivos reais** (iPhone Safari, Android Chrome) para toque, teclado virtual e zoom do sistema; os E2E usam emulação do Chromium.
4. Correção dos achados graves que esses testes revelarem, em novas issues.

Enquanto as pendências 1 e 2 não forem executadas, **não se deve afirmar** que a interface "foi testada com leitor de tela e com usuários".
