# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado
- Documentação inicial: especificação, requisitos (RF, RNF, RN), casos de uso, histórias, ADRs 0001–0005, glossário e backlog inicial.
- Esqueleto do backend orientado a objetos: `Money`, `TaxRate`, `TaxYear`, `CompanyProfile`, `TaxRegime` e regimes, `TaxStrategy`, repositório em memória da transição CBS/IBS e `GET /v1/health`.
- Lint de arquitetura (OO e camadas), testes com cobertura mínima de 80% e CI.
- Simples Nacional puro de 2026 a 2033 (#4): `DasStrategy`, Anexos III e V, alíquota efetiva, Fator R e partilha do DAS com a composição CBS/IBS por ano (RN-04, RN-05), com casos golden conferidos à mão. Tabelas de referência em memória atrás da porta `TaxRateTableRepository`.
- Estratégias de tributos sobre o consumo (#5): `CbsStrategy`, `IbsStrategy`, `IcmsStrategy`, `IssStrategy` e `PisCofinsStrategy`, com débito menos crédito e a transição de cada ano (RN-02); `CompanyProfile` aceita a alíquota de ICMS/ISS informada.
- Planejamento do front-end: plano, wireframes, design system, acessibilidade, pesquisa com usuários, backlog (FE-01 a FE-20), ADR-0006 e registro de decisões; novos RF-09 a RF-11, RNF-09 a RNF-12 e US-05 a US-10.
