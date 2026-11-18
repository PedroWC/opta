# Backlog do front-end

> **Status:** aprovado em 2026-11-18. Os itens `FE-nn` viram issues ligadas à #12 (FE-01 a FE-16); FE-17 a FE-20 permanecem como planejamento. O backlog geral está em [backlog-inicial.md](../processo/backlog-inicial.md) e a numeração de issues é a do repositório remoto. Plano: [plano-frontend.md](plano-frontend.md).

## 1. IDs novos propostos (documentar antes de implementar, conforme as regras do repositório)

Os IDs existentes continuam valendo; abaixo só o que o front acrescenta. IDs nunca são reutilizados: ao aprovar, entram em `ers.md` e `historias-de-usuario.md` com estes números.

### Requisitos funcionais

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-09 | A simulação pode ser reaberta e compartilhada por link, sem armazenar dados no servidor (estado no fragmento da URL). | Média | MVP |
| RF-10 | O formulário oferece um exemplo preenchido (cenário da US-01) e uma dica do Fator R aproximado. | Baixa | MVP |
| RF-11 | A interface exibe, em todas as telas, o aviso de simulador educacional e a versão das premissas, e traz uma página de metodologia com fontes legais. | Alta | MVP |

### Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-09 | Acessibilidade WCAG 2.2 nível AA nas telas do simulador, verificada por axe no CI e por teste manual com teclado e leitor de tela. |
| RNF-10 | Interface responsiva de 320 px a 1440 px, sem rolagem horizontal da página em 320 px. |
| RNF-11 | Desempenho percebido: LCP ≤ 2,5 s em 4G simulado, JS inicial ≤ 200 KB gzip, CLS < 0,1. |
| RNF-12 | O front não registra nem envia a terceiros os dados da simulação (sem analytics no MVP); os dados do link ficam no fragmento da URL. |

### Casos de uso (ajustes)

UC-01, passo 5 ("exibe tabela, gráfico e memória"): acrescentar o fluxo alternativo "usuário copia o link ou ajusta os dados" (RF-09). UC-03 passa a ser acionável também pela tela de simulador (CNAE).

### Histórias de usuário novas

**US-05 — Começar com um exemplo.** Como empresário que não sabe por onde começar, quero preencher o formulário com um exemplo, para ver como o resultado funciona antes de usar meus números. *(RF-10)*
*Dado* o formulário vazio, *quando* aciono "Preencher com um exemplo", *então* os campos recebem o cenário da US-01 e o leitor de tela anuncia que o exemplo foi preenchido.

**US-06 — Entender e corrigir erros.** Como empresário, quero mensagens claras de erro junto de cada campo, para corrigir sem perder o que já digitei. *(RF-01, RN-09, RNF-07, RNF-09)*
*Dado* receita vazia e percentual B2B 120, *quando* envio, *então* vejo um resumo com 2 erros, o foco vai ao resumo, cada mensagem diz o que fazer e os demais campos continuam preenchidos.

**US-07 — Compartilhar e reabrir.** Como empresário, quero copiar um link do resultado para mostrar ao meu contador, sem criar conta. *(RF-09, RNF-12)*
*Dado* um resultado exibido, *quando* copio o link e o abro em outra aba, *então* vejo a mesma simulação; e *dado* um link com dado inválido, *então* caio no formulário com aviso e os campos válidos preenchidos.

**US-08 — Usar no celular.** Como empresário, quero simular e ler o resultado no celular, sem rolagem horizontal. *(RF-08, RNF-10)*
*Dado* uma tela de 320 px, *quando* abro o resultado, *então* tabela e memória de cálculo aparecem como cartões legíveis e o gráfico cabe na largura.

**US-09 — Usar com teclado e leitor de tela.** Como pessoa que usa tecnologia assistiva, quero concluir uma simulação e ler o resultado sem mouse. *(RNF-09)*
*Dado* um leitor de tela e só o teclado, *quando* sigo o fluxo da US-01, *então* consigo preencher, enviar, ouvir a recomendação, ler a tabela equivalente ao gráfico e abrir a memória de cálculo.

**US-10 — Consultar atividade e premissas na interface.** Como contador, quero consultar o CNAE e as alíquotas de transição por ano sem fazer uma simulação. *(RF-04, RF-05, RF-11; complementa a US-03)*

Histórias existentes cobertas pelo front: **US-01** (FE-06, FE-08, FE-09), **US-02** (FE-08), **US-03** (FE-07, FE-12), **US-04** (FE-10).

## 2. Itens de backlog do front

Tamanho: P (≤ 1 dia), M (1 a 2 dias), G (2 a 4 dias) de uma pessoa, com incerteza explícita.

| ID | Item | Liga a (existentes e propostos) | Depende de | Tam. |
|---|---|---|---|---|
| FE-01 | **Scaffold de `web/`**: Vite, React, TS estrito, ESLint (`jsx-a11y`), Vitest, proxy `/v1`, scripts na raiz, job no CI | #2, RNF-09, ADR-0006 | ADR-0006 aprovado | P |
| FE-02 | **Tokens e base de estilo**: primitivos, semânticos, tema, reset, foco, impressão; teste de contraste dos pares | RNF-09, RNF-10 | FE-01 | M |
| FE-03 | **Biblioteca `ui/`**: Button, TextField, Money/Percent, Select, Slider, CheckboxGroup, Callout, Disclosure, Tabs, Table, Skeleton, Badge; testes de teclado e axe; vitrine | RNF-09, RF-08 | FE-02 | G |
| FE-04 | **AppShell e rotas**: header, navegação (mobile em `dialog`), pular link, rodapé, aviso legal e versão, anunciador de rota, 404, `/sobre` | RF-11, US-10, RNF-09 | FE-03 | M |
| FE-05 | **Camada de API**: `OptaApiClient`, `ProblemDetailsError`, hooks TanStack Query, MSW e fixtures tipadas; troca para tipos gerados quando o contrato existir | #9, RF-01, RF-04, RF-05, RNF-07 | FE-01; contrato do #9 (pode começar com fixtures) | M |
| FE-06 | **Formulário do simulador**: esquema Zod (RN-09), campos, B2B/B2C complementares, resumo de erros, mapeamento de 422, dica de Fator R | RF-01, RF-10, RN-09, US-01, US-05, US-06 | FE-03, FE-05 | G |
| FE-07 | **Combobox de CNAE** e cartão de atividade (padrão APG), busca com debounce e cancelamento | RF-05, UC-03, US-03, US-10, RN-09 | FE-03, FE-05, #11 | M |
| FE-08 | **Resultado, parte 1**: carregamento, recomendação, tabela comparativa com total acumulado, cartões no mobile, avisos | RF-02, RF-03, RN-08, US-01, US-02, US-08 | FE-04, FE-05, #8, #10 | M |
| FE-09 | **Gráfico por ano acessível**: séries com marcador, traço e rótulo direto, tabela equivalente, carga sob demanda, mobile | RF-08, RF-02, US-09, RNF-09, RNF-11 | FE-08 | G |
| FE-10 | **Memória de cálculo**: acordeão por ano, abas por regime, forma mobile em lista de definição, fonte legal por linha | RF-06, US-04, RNF-10 | FE-08 | M |
| FE-11 | **Estado na URL**: codec do fragmento, "Copiar link", "Ajustar dados", exemplo preenchido, links inválidos | RF-09, RF-10, RNF-12, US-05, US-07 | FE-06, FE-08 | M |
| FE-12 | **Página de premissas**: tabela de transição por ano e consulta de CNAE | RF-04, RN-02, UC-02, US-03, US-10 | FE-04, FE-05, #11 | M |
| FE-13 | **Estados de erro, vazio, parcial e offline** em todas as telas (SIM-001/002, 501, 5xx, rede) | RNF-07, RF-11 | FE-05, FE-08 | P |
| FE-14 | **Testes E2E**: US-01, US-02, link compartilhável, erro 422, axe nas telas, viewports | RF-08, RNF-09, RNF-10, spec §8 | FE-06, FE-08, FE-11 | M |
| FE-15 | **Auditoria final**: revisão de acessibilidade (WCAG 2.2 AA, leitor de tela), revisão heurística e teste com 5 usuários; correção dos achados graves | RNF-09, RNF-10, US-09 | FE-14 | M |
| FE-16 | **Build e entrega do front**: build estático, CSP e cabeçalhos, mesma origem ou CORS, medição Lighthouse | #14, RNF-11, RNF-12 | FE-14 | P |
| FE-17 | **Documentação**: wireframes finais em `docs/prototipos/`, README, CHANGELOG, rastreabilidade, ERS, histórias | Regras do repositório, definição de pronto | cada fatia | P |
| FE-18 | *(pós-MVP)* Sensibilidade interativa ao % B2B (recalcula com debounce) | US-02 | FE-08 | M |
| FE-19 | *(pós-MVP)* Tema escuro e alto contraste; EN | RNF-09 | FE-02 | M |
| FE-20 | *(pós-MVP)* Exportar CSV e folha de impressão refinada | RF-06 | FE-10 | P |

Como o #12 do backlog ("Formulário, tabela comparativa e gráfico") é grande demais para uma única branch, sugere-se **quebrá-lo em issues menores** (FE-01 a FE-16), todas ligadas ao #12, no padrão `feat/<issue>-<slug>` das regras do repositório. Não criei issues: aguardo o seu pedido.

## 3. Fatias verticais (ordem sugerida)

| Fatia | Itens | Resultado que funciona de ponta a ponta | Quando pode começar |
|---|---|---|---|
| A. Esqueleto andante | FE-01, FE-02, FE-04, FE-05 (com MSW) | Navegar entre as rotas vazias, com aviso legal e tokens | Já (só precisa do ADR-0006 e do #2) |
| B. Primeira simulação | FE-03 (parcial), FE-06, FE-08 | Preencher o formulário, ver recomendação e tabela com dados simulados | Depois de A; real com #8 e #10 |
| C. Resultado completo | FE-09, FE-10, FE-11, FE-13 | Gráfico, memória de cálculo, link compartilhável e estados de erro | Depois de B |
| D. Consulta | FE-07, FE-12 | CNAE e premissas | Depois de #11 (pode usar MSW antes) |
| E. Endurecimento | FE-14, FE-15, FE-16, FE-17 | E2E, auditoria, teste com usuários, deploy | Depois de C e D, junto com #14 |

Paralelismo: o front só depende do backend real nas fatias B (#8, #10) e D (#11); com contrato (#9) e fixtures, A, B e C avançam em paralelo ao backend.

## 4. Estimativa (faixa, com premissas)

- Fatia A: 2 a 4 dias · B: 4 a 7 dias · C: 4 a 7 dias · D: 2 a 4 dias · E: 3 a 5 dias. **Total: 15 a 27 dias de trabalho de uma pessoa**, sem contar a espera pelo backend.
- Premissas: um desenvolvedor, componentes simples escritos à mão (sem Storybook completo), 1 rodada de teste com 5 usuários; o contrato do #9 incorpora os pedidos da seção 7 do plano. Incerteza maior: gráfico acessível (FE-09) e combobox (FE-07).
- Riscos: contrato sem erros por campo (retrabalho no FE-06); Recharts insuficiente para teclado/leitor de tela (troca por visx, +2 dias); regras ⚠️ da legislação mudarem textos de aviso.

## 5. Rastreabilidade (proposta de linhas para `rastreabilidade.md`)

| Requisito | Caso de uso | História | Itens de front | Teste previsto |
|---|---|---|---|---|
| RF-01 | UC-01 | US-01, US-06 | FE-06 | `web` Vitest (esquema RN-09) + E2E |
| RF-02 | UC-01 | US-01 | FE-08, FE-09 | Componente + E2E |
| RF-03 | UC-01 | US-02 | FE-08 | Componente + E2E |
| RF-04 | UC-02 | US-03, US-10 | FE-12 | Componente + E2E |
| RF-05 | UC-03 | US-03, US-10 | FE-07, FE-12 | Componente (teclado) |
| RF-06 | UC-01 | US-04 | FE-10 | Componente |
| RF-08 | UC-01 | US-01, US-08 | FE-03 a FE-11 | E2E |
| RF-09 | UC-01 | US-07 | FE-11 | Unitário (codec) + E2E |
| RF-10 | UC-01 | US-05 | FE-06, FE-11 | Componente |
| RF-11 | — | US-10 | FE-04, FE-13 | Componente |
| RNF-09 | — | US-09 | FE-03, FE-14, FE-15 | axe (componente e E2E) + manual |
| RNF-10 | — | US-08 | FE-02, FE-14 | Playwright (viewports) |
| RNF-11 | — | — | FE-09, FE-16 | Lighthouse |
| RNF-12 | — | US-07 | FE-11, FE-16 | Revisão de rede no E2E |

## 6. Definição de pronto por item de front

Além da [definição de pronto geral](../processo/definicao-de-pronto.md): critérios transversais de [acessibilidade e responsividade](acessibilidade-e-responsividade.md#3-critérios-de-aceite-transversais-valem-para-todo-item-de-front) cumpridos; todos os estados desenhados nos [wireframes](../prototipos/wireframes-simulador.md) implementados; textos conforme os microtextos aprovados; nome dos testes com o ID coberto; `npm run check` do backend e do `web/` verdes.

## 7. Decisões tomadas (antes pendentes)

1. ADR-0006 (SPA com Vite, `web/` no mesmo repositório): **aceito**.
2. IDs novos RF-09 a RF-11, RNF-09 a RNF-12 e US-05 a US-10: **aprovados** e já incorporados à ERS, às histórias e à rastreabilidade.
3. Quebra da #12 em issues FE-01 a FE-16: **aprovada**.
4. Fator R aproximado no formulário: **sim**, como dica informativa.
5. Foco da demo: **empresário**, com linguagem simples; memória de cálculo e metodologia em nível técnico, para o contador.
6. Recharts com tabela equivalente: **mantido**.

Ainda em aberto: o contrato (#9) precisa incorporar os pedidos da seção 7 do [plano](plano-frontend.md) (erros por campo, decimais em texto, busca de atividade, entre outros).

## 8. Issues criadas

Issues FE-01 a FE-16 criadas em 2026-11-18, todas ligadas à #12 ("Parte de #12"). FE-17 a FE-20 não geram issue.

| ID | Issue | Título |
|---|---|---|
| FE-01 | #16 | feat(web): scaffold do projeto web (Vite, React, TS estrito, Vitest) |
| FE-02 | #17 | feat(web): tokens de design e base de estilo |
| FE-03 | #18 | feat(web): biblioteca de componentes ui/ |
| FE-04 | #19 | feat(web): AppShell, rotas, aviso legal e página Sobre |
| FE-05 | #20 | feat(web): camada de API do front (cliente, erros e hooks) |
| FE-06 | #21 | feat(web): formulário do simulador com validação e resumo de erros |
| FE-07 | #22 | feat(web): combobox de CNAE e cartão de atividade |
| FE-08 | #23 | feat(web): resultado da simulação: recomendação e tabela comparativa |
| FE-09 | #24 | feat(web): gráfico por ano acessível com tabela equivalente |
| FE-10 | #25 | feat(web): memória de cálculo por ano e por regime |
| FE-11 | #26 | feat(web): estado da simulação na URL e botão Copiar link |
| FE-12 | #27 | feat(web): página de premissas com tabela de transição e consulta de CNAE |
| FE-13 | #28 | feat(web): estados de erro, vazio, parcial e offline |
| FE-14 | #29 | test(web): testes E2E dos fluxos principais |
| FE-15 | #30 | test(web): auditoria final de acessibilidade e usabilidade |
| FE-16 | #31 | ci(web): build estático, cabeçalhos de segurança e medição de desempenho |
