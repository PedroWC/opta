# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado
- Documentação inicial: especificação, requisitos (RF, RNF, RN), casos de uso, histórias, ADRs 0001–0005, glossário e backlog inicial.
- Esqueleto do backend orientado a objetos: `Money`, `TaxRate`, `TaxYear`, `CompanyProfile`, `TaxRegime` e regimes, `TaxStrategy`, repositório em memória da transição CBS/IBS e `GET /v1/health`.
- Lint de arquitetura (OO e camadas), testes com cobertura mínima de 80% e CI.
- Simples Nacional puro de 2026 a 2033 (#4): `DasStrategy`, Anexos III e V, alíquota efetiva, Fator R e partilha do DAS com a composição CBS/IBS por ano (RN-04, RN-05), com casos golden conferidos à mão. Tabelas de referência em memória atrás da porta `TaxRateTableRepository`.
- Estratégias de tributos sobre o consumo (#5): `CbsStrategy`, `IbsStrategy`, `IcmsStrategy`, `IssStrategy` e `PisCofinsStrategy`, com débito menos crédito e a transição de cada ano (RN-02); `CompanyProfile` aceita a alíquota de ICMS/ISS informada.
- Lucro Presumido (#6): `IrpjStrategy` (com adicional), `CsllStrategy`, `CppStrategy` e `ActivitySalesTax` (ISS ou ICMS), compondo o regime com os tributos sobre o consumo de 2026 a 2033 (RN-07).
- Simples híbrido (#7): `HybridDasStrategy` (DAS sem as parcelas de CBS/IBS) e CBS/IBS no regime regular (RN-06); `EmbeddedCustomerCredit` e `FullCustomerCredit` demonstram o crédito ao cliente B2B (RN-10).
- Comparador e recomendação (#8): `RegimeComparison`, `Recommendation` e `DecisiveFactor` (menor carga no ano e acumulada, economia sobre o segundo colocado e fator decisivo por categoria) e `CompareRegimesUseCase` (RN-08, RF-03).
- Contrato OpenAPI 3.1 da API v1 (#9) em `docs/api/openapi.yaml`, com os pedidos do front-end (DEC-14), validado por teste de contrato.
- API de simulações (#10): `POST /v1/simulacoes` com validação (zod encapsulado em classe), erros em `application/problem+json` com erros por campo, regimes indisponíveis sem derrubar os demais e resposta validada contra o contrato OpenAPI (RF-01 a RF-03, RF-06, RNF-07, RN-09).
- API de referência (#11): `GET /v1/premissas/aliquotas`, `GET /v1/atividades` (CNAE exato ou busca paginada por texto) e `GET /v1/versao`, com catálogo único de atividades e respostas validadas contra o contrato (RF-04, RF-05, RF-07).
- Persistência das tabelas fiscais com vigência (#3): migrações e sementes (`ALIQUOTA_TRANSICAO`, `SIMPLES_ANEXO_FAIXA`, `SIMPLES_REPARTICAO`, `ATIVIDADE_CNAE`, `REGIME_PARAMETRO`), `SqlTaxRateTableRepository` com adaptadores SQLite e Oracle (bind variables) e a mesma suíte de contrato para memória e SQLite (RNF-05).
- Testes de propriedades (fast-check) e de mutação (Stryker, 90,05%, limiar de 85% no ADR-0007) no núcleo; aviso na API de que, acima de R$ 3,6 milhões, ISS/ICMS saem do DAS e não são calculados (#13).
- Biblioteca de componentes acessíveis `web/src/ui` (#18), com campo de dinheiro que entrega texto decimal (RNF-02), abas no padrão APG, testes de teclado e axe sobre a vitrine.
- Tokens de design (primitivos, semânticos, tema escuro) e base de estilo (foco visível, movimento reduzido, utilitários de acessibilidade, impressão) com teste de contraste WCAG dos pares de cores (#17).
- Esqueleto da interface web em `web/` (#16): Vite, React, TypeScript estrito, Vitest, ESLint com `jsx-a11y`, proxy `/v1` e job de CI próprio (ADR-0006).
- Planejamento do front-end: plano, wireframes, design system, acessibilidade, pesquisa com usuários, backlog (FE-01 a FE-20), ADR-0006 e registro de decisões; novos RF-09 a RF-11, RNF-09 a RNF-12 e US-05 a US-10.
