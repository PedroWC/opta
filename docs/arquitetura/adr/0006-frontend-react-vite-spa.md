# ADR-0006 — Front-end: React com Vite (SPA) em pacote próprio

- **Status:** Aceito (decisão do mantenedor em 2026-11-18; ver [registro de decisões](../../processo/registro-de-decisoes.md))
- **Requisitos:** RF-08, RNF-03, RNF-06, RNF-09, RNF-10, RNF-11 (propostos), US-01 a US-04

## Contexto
O ADR-0002 prevê "React com Vite" para o front-end. A especificação (seção 7) cita React com Vite e TanStack Query, e a seção 4.1 exclui o React da regra de backend 100% OO. É preciso fixar a forma de entrega (SPA ou renderização no servidor), a localização no repositório e a fronteira com o backend.

As telas são ferramentas de simulação, sem conteúdo indexável por página; a única "página de conteúdo" (Metodologia) é pequena. O diferencial do projeto está no backend e na qualidade do resultado, não em renderização.

## Decisão
1. **SPA com React, TypeScript estrito e Vite**, roteamento com React Router, dados com TanStack Query, formulário com React Hook Form e Zod, estilo com CSS Modules e tokens em CSS custom properties.
2. **Pacote próprio em `web/`** no mesmo repositório, com `package.json`, ESLint e CI próprios, sem workspaces no MVP. O front não importa código de `src/`.
3. **O elo com o backend é só o contrato OpenAPI** (issue #9): os tipos do front são gerados dele. O backend continua a única fonte de regra fiscal; o front não calcula tributos.
4. **Estado da simulação no fragmento da URL** (`#`), para reproduzir e compartilhar sem persistência no servidor e sem enviar os dados a logs de hospedagem.
5. **A regra de OO do ADR-0001 não vale para o front.** Mantém-se a separação de responsabilidades: `OptaApiClient` e `ProblemDetailsError` são classes; componentes são funções React; regras de formatação ficam em módulos puros.
6. **Acessibilidade WCAG 2.2 AA e responsividade são requisitos verificados em CI** (axe, jsx-a11y) e em testes manuais.

## Alternativas consideradas
- **Next.js (SSR/SSG):** descartado: sem necessidade de SEO por página nem de SSR, exige servidor Node adicional e acopla o deploy. Se o projeto ganhar páginas públicas de conteúdo (artigo técnico, #15), uma geração estática separada resolve sem mudar a SPA.
- **Renderização no servidor pelo próprio Hono (HTML/htmx):** coerente com OO no backend, mas perde o gráfico interativo e o ecossistema de acessibilidade de componentes; descartado para a vitrine.
- **Repositório separado para o front:** descartado: dois clones, dois CIs e demo menos coesa para o portfólio.
- **Tailwind:** descartado para manter tokens semânticos como contrato de design.

## Consequências
- O CI ganha um job para `web/`; o `eslint.config.js` e o `.dependency-cruiser.cjs` do backend não são afetados.
- O contrato precisa antecipar necessidades do front (erros por campo, decimais como texto, busca de atividade); ver o plano.
- Em produção, servir front e API sob a mesma origem ou configurar CORS restrito (decidir em #14).
- Sem SEO por página: aceitável para uma ferramenta; a página Metodologia terá `title` e `description` próprios.
- Se a tabela de acessibilidade do gráfico não atingir o nível desejado, trocar Recharts por visx sem afetar as demais camadas.
