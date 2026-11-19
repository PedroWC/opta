# Matriz de rastreabilidade

Liga cada requisito e regra a casos de uso, histórias de usuário e testes. **Mantenha esta matriz atualizada a cada mudança** (regra do projeto).

| Requisito/Regra | Caso de uso | História | Teste | Situação |
|---|---|---|---|---|
| RF-01 | UC-01 | US-01, US-06 | `test/presentation/simulation-api.test.ts`, `web/src/features/simulator/simulator.test.tsx`, `test/domain/das-strategy.test.ts`, `test/domain/lucro-presumido.test.ts` | Coberto na API (`POST /v1/simulacoes`) e no formulário da interface (`web/src/features/simulator`); resultado na interface pendente (#23) |
| RF-02 | UC-01 | US-01 | `test/presentation/simulation-api.test.ts`, `test/application/simulate-regimes-use-case.test.ts`, `test/domain/das-strategy.test.ts` | Coberto (três regimes nos 8 anos, expostos pela API) ; tabela e cartões na interface (`web/src/pages/result.test.tsx`) |
| RF-03 | UC-01 | US-02 | `test/presentation/simulation-api.test.ts`, `test/domain/regime-comparison.test.ts`, `test/application/compare-regimes-use-case.test.ts` | Coberto (recomendação na API) ; recomendação na interface (`web/src/pages/result.test.tsx`) |
| RF-04 | UC-02 | US-03, US-10 | `test/presentation/reference-api.test.ts`, `test/contract/api-conforms-to-openapi.test.ts` | Coberto na API (`GET /v1/premissas/aliquotas`); tela pendente (#12) |
| RF-05 | UC-03 | US-03, US-10 | `test/presentation/reference-api.test.ts`, `test/contract/api-conforms-to-openapi.test.ts`, `web/src/features/simulator/cnae.test.tsx`, `web/src/ui/combobox.test.tsx` | Coberto na API (`GET /v1/atividades`) e no combobox de CNAE do simulador (teclado, busca com espera, cartão da atividade); consulta na tela de premissas pendente (#27) |
| RF-06 | UC-01 | US-04 | `test/presentation/simulation-api.test.ts`, `test/domain/tax-regime.test.ts`, `web/src/features/result/memory.test.tsx` | Coberto na API e na interface (acordeão por ano, abas por regime, fonte legal por linha, partilha como detalhe) |
| RF-07 | — | — | `test/health.test.ts`, `test/presentation/reference-api.test.ts` | Coberto (`/v1/health` e `/v1/versao`) |
| RF-08 | UC-01 | US-01, US-08 | `web/src/features/result/chart.test.tsx`, `web/src/pages/result.test.tsx`, `web/src/features/result/memory.test.tsx` | Parcial (formulário, tabela e gráfico por ano na interface; memória de cálculo na interface; E2E pendente: #29) |
| RF-09 | UC-01 | US-07 | — | Pendente (plano em `docs/frontend/`) |
| RF-10 | UC-01 | US-05 | — | Pendente |
| RF-11 | — | US-10 | — | Pendente |
| RN-01 | UC-01 | US-01 | `test/domain/transition.test.ts` | Coberto |
| RN-02 | UC-01, UC-02 | US-01, US-03 | `test/domain/transition.test.ts`, `test/domain/consumption-taxes.test.ts` | Coberto nas estratégias (repositório em memória; persistência na #3) |
| RN-03 | UC-01 | US-04 | `test/domain/money.test.ts` | Coberto |
| RN-04 | UC-01 | US-01 | `test/domain/das-strategy.test.ts`, `test/domain/simples-tables.test.ts` | Coberto (golden conferidos à mão; tabelas ⚠️ a conferir na fonte) |
| RN-05 | UC-01 | US-01 | `test/domain/das-strategy.test.ts`, `test/domain/simples-tables.test.ts` | Coberto |
| RN-06 | UC-01 | US-02 | `test/domain/tax-regime.test.ts` (herança), `test/domain/simples-hibrido.test.ts` | Coberto (golden 2026, 2027, 2029 e 2033) |
| RN-07 | UC-01 | US-01 | `test/domain/lucro-presumido.test.ts` | Coberto (golden de serviços e comércio; presunções ⚠️) |
| RN-08 | UC-01 | US-02 | `test/domain/regime-comparison.test.ts`, `test/application/compare-regimes-use-case.test.ts` | Coberto (golden dos três regimes em 8 anos) |
| RN-09 | UC-01 | US-01 | `test/domain/company-profile.test.ts`, `web/src/features/simulator/simulator.test.tsx` | Coberto |
| RN-10 | UC-01 | US-02 | `test/domain/simples-hibrido.test.ts` | Coberto (crédito embutido x integral; ⚠️) |
| RNF-01 | — | — | `eslint.config.js` e `.dependency-cruiser.cjs` (lint) | Coberto |
| RNF-05 | — | — | `test/infrastructure/tax-rate-table-repository.contract.test.ts`, `test/infrastructure/sql-vigencia.test.ts`, `test/infrastructure/oracle-adapter.test.ts` | Coberto em memória e SQLite; Oracle só com conexão falsa (integração real pendente) |
| RNF-07 | — | — | `test/presentation/simulation-api.test.ts`, `test/contract/api-conforms-to-openapi.test.ts`, `web/src/api/client.test.ts`, `web/src/api/hooks.test.tsx` | Coberto em `/v1/simulacoes` (400/422/404/500 em Problem Details) e no cliente do front (erros tipados, 422 com campos) |
| RNF-04 (qualidade do núcleo) | — | — | `test/properties/*.properties.test.ts`, `stryker.config.json` (ADR-0007) | Coberto (propriedades; mutação 90,05%) |
| RNF-03 | — | — | `test/contract/openapi-contract.test.ts` | Coberto (contrato válido; implementação nas issues #10 e #11) |
| RNF-04 | — | — | `vitest.config.ts` (limiar de cobertura) | Coberto |
| RNF-08 | — | — | `.dependency-cruiser.cjs` | Coberto |
| RNF-09 | — | US-09 | `web/eslint.config.js` (jsx-a11y), `web/src/App.test.tsx`, `web/src/styles/tokens.test.ts`, `web/src/ui/ui.test.tsx`, `web/src/app/app.test.tsx` | Parcial (lint, landmarks, contraste AA, axe em todas as telas, teclado, pular link e anúncio de rota; testes manuais e E2E nas issues #29 e #30) |
| RNF-10 | — | US-08 | — (viewports no E2E, previsto no FE-14) | Pendente |
| RNF-11 | — | — | — (Lighthouse, previsto no FE-16) | Pendente |
| RNF-12 | — | US-07 | — | Pendente |

Itens de front-end (FE-nn) e a ligação com os testes previstos: [backlog do front-end](../frontend/backlog-frontend.md), seção 5.
