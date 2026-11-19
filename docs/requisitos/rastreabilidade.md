# Matriz de rastreabilidade

Liga cada requisito e regra a casos de uso, histórias de usuário e testes. **Mantenha esta matriz atualizada a cada mudança** (regra do projeto).

| Requisito/Regra | Caso de uso | História | Teste | Situação |
|---|---|---|---|---|
| RF-01 | UC-01 | US-01, US-06 | `test/domain/das-strategy.test.ts`, `test/domain/lucro-presumido.test.ts` | Parcial (Simples puro e Lucro Presumido; híbrido pendente) |
| RF-02 | UC-01 | US-01 | `test/application/simulate-regimes-use-case.test.ts`, `test/domain/das-strategy.test.ts` | Parcial (Simples puro e Lucro Presumido nos 8 anos; híbrido pendente) |
| RF-03 | UC-01 | US-02 | — | Pendente |
| RF-04 | UC-02 | US-03, US-10 | — | Pendente |
| RF-05 | UC-03 | US-03, US-10 | — | Pendente |
| RF-06 | UC-01 | US-04 | `test/domain/tax-regime.test.ts` | Parcial (estrutura da memória de cálculo) |
| RF-07 | — | — | `test/health.test.ts` | Coberto |
| RF-08 | UC-01 | US-01, US-08 | — | Pendente |
| RF-09 | UC-01 | US-07 | — | Pendente (plano em `docs/frontend/`) |
| RF-10 | UC-01 | US-05 | — | Pendente |
| RF-11 | — | US-10 | — | Pendente |
| RN-01 | UC-01 | US-01 | `test/domain/transition.test.ts` | Coberto |
| RN-02 | UC-01, UC-02 | US-01, US-03 | `test/domain/transition.test.ts`, `test/domain/consumption-taxes.test.ts` | Coberto nas estratégias (repositório em memória; persistência na #3) |
| RN-03 | UC-01 | US-04 | `test/domain/money.test.ts` | Coberto |
| RN-04 | UC-01 | US-01 | `test/domain/das-strategy.test.ts`, `test/domain/simples-tables.test.ts` | Coberto (golden conferidos à mão; tabelas ⚠️ a conferir na fonte) |
| RN-05 | UC-01 | US-01 | `test/domain/das-strategy.test.ts`, `test/domain/simples-tables.test.ts` | Coberto |
| RN-06 | UC-01 | US-02 | `test/domain/tax-regime.test.ts` (herança) | Parcial |
| RN-07 | UC-01 | US-01 | `test/domain/lucro-presumido.test.ts` | Coberto (golden de serviços e comércio; presunções ⚠️) |
| RN-08 | UC-01 | US-02 | — | Pendente |
| RN-09 | UC-01 | US-01 | `test/domain/company-profile.test.ts` | Coberto |
| RN-10 | UC-01 | US-02 | — | Pendente |
| RNF-01 | — | — | `eslint.config.js` e `.dependency-cruiser.cjs` (lint) | Coberto |
| RNF-04 | — | — | `vitest.config.ts` (limiar de cobertura) | Coberto |
| RNF-08 | — | — | `.dependency-cruiser.cjs` | Coberto |
| RNF-09 | — | US-09 | — (axe no CI e teste manual, previstos no FE-14 e FE-15) | Pendente |
| RNF-10 | — | US-08 | — (viewports no E2E, previsto no FE-14) | Pendente |
| RNF-11 | — | — | — (Lighthouse, previsto no FE-16) | Pendente |
| RNF-12 | — | US-07 | — | Pendente |

Itens de front-end (FE-nn) e a ligação com os testes previstos: [backlog do front-end](../frontend/backlog-frontend.md), seção 5.
