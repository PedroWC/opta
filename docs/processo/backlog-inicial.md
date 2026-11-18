# Backlog inicial (issues)

Estas são as issues criadas em `PedroWC/opta` (numeração conferida). Cada uma lista a branch sugerida (`<tipo>/<issue>-<slug>`), os IDs e os critérios de aceite. Fases conforme [especificação](../especificacao.md), seção 9.

| # | Branch sugerida | Título | Fase |
|---|---|---|---|
| 1 | `docs/1-documentacao-inicial` | Documentação inicial (requisitos, ADRs, glossário) | 0 |
| 2 | `chore/2-estrutura-inicial` | Estrutura inicial do projeto e CI | 0 |
| 3 | `feat/3-tabelas-de-aliquotas-com-vigencia` | Persistência de tabelas com vigência (Oracle e SQLite) | 0 |
| 4 | `feat/4-simples-nacional-puro` | Simples Nacional puro 2026–2033 | 1 |
| 5 | `feat/5-transicao-cbs-ibs-nos-tributos` | Estratégias CBS, IBS, PIS/Cofins, ICMS/ISS | 2 |
| 6 | `feat/6-lucro-presumido` | Lucro Presumido | 2 |
| 7 | `feat/7-simples-hibrido` | Simples híbrido | 3 |
| 8 | `feat/8-comparador-e-recomendacao` | Comparador de regimes e recomendação explicada | 3 |
| 9 | `docs/9-contrato-openapi-v1` | Contrato OpenAPI 3.1 da API v1 | 4 |
| 10 | `feat/10-api-de-simulacoes` | `POST /v1/simulacoes` com validação e erros Problem Details | 4 |
| 11 | `feat/11-api-de-premissas-e-atividades` | `GET /v1/premissas/aliquotas` e `GET /v1/atividades` | 4 |
| 12 | `feat/12-interface-web-do-simulador` | Formulário, tabela comparativa e gráfico | 4 |
| 13 | `test/13-propriedades-e-mutacao-no-nucleo` | Testes de propriedades e mutação no núcleo | 4 |
| 14 | `ci/14-deploy-e-demo` | Deploy e demonstração pública | 5 |
| 15 | `docs/15-readme-e-artigo-tecnico` | README final e artigo técnico | 5 |

## Detalhes e critérios de aceite

**#1 Documentação inicial** — RF/RNF/RN, UC, US, ADRs 0001–0005 e glossário revisados. *Aceite:* PR de docs aprovado; sem dados pessoais.

**#2 Estrutura inicial** — projeto TypeScript, lint com regra de OO e de camadas, cobertura mínima de 80%, CI. *Aceite:* `npm run check` verde no CI. (RNF-01, RNF-04, RNF-08)

**#3 Tabelas com vigência** — migrações e seeds de `ALIQUOTA_TRANSICAO`, `SIMPLES_ANEXO_FAIXA`, `SIMPLES_REPARTICAO`, `ATIVIDADE_CNAE`, `REGIME_PARAMETRO`; adaptadores Oracle e SQLite com os mesmos testes de contrato. *Aceite:* troca do repositório em memória sem mudar o domínio; bind variables. (RNF-05, ADR-0004, ADR-0005)

**#4 Simples Nacional puro** — `DasStrategy`, anexos III e V, Fator R, partilha do DAS. *Aceite:* casos "golden" conferidos em planilha para os 8 anos. (RN-04, RN-05, RF-01, RF-02)

**#5 Estratégias de CBS/IBS** — `CbsStrategy`, `IbsStrategy`, `PisCofinsStrategy`, `IcmsStrategy`, `IssStrategy`. *Aceite:* débito menos crédito conforme transição de cada ano. (RN-02, RN-10)

**#6 Lucro Presumido** — IRPJ, CSLL, CPP e tributos sobre consumo. *Aceite:* golden por ano, incluindo adicional de IRPJ. (RN-07)

**#7 Simples híbrido** — herda de `SimplesNacional`, retira PIS/Cofins/ICMS/ISS do DAS e apura CBS/IBS no regime regular. *Aceite:* crédito cheio ao cliente B2B demonstrado em teste. (RN-06, RN-10)

**#8 Comparador e recomendação** — menor carga no ano e acumulada, com fator decisivo explicado. *Aceite:* recomendação com `motivo` e `economia_acumulada`. (RN-08, RF-03)

**#9 Contrato OpenAPI** — escrito antes de #10 e #11. *Aceite:* validado e usado em testes de contrato. (RNF-03, RNF-07)

**#10 a #12** — implementam o contrato e a interface, com testes de segurança de entrada (400/422). (RF-01, RF-04, RF-05, RF-08)

**#13 Propriedades e mutação** — fast-check nas fórmulas e Stryker no núcleo. *Aceite:* score de mutação definido em ADR.

**#14 e #15** — deploy, demonstração e documentação final. Release somente por decisão explícita do mantenedor.

> Observação: os números acima correspondem às issues reais do repositório remoto.
