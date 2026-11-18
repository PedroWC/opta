# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado
- Documentação inicial: especificação, requisitos (RF, RNF, RN), casos de uso, histórias, ADRs 0001–0005, glossário e backlog inicial.
- Esqueleto do backend orientado a objetos: `Money`, `TaxRate`, `TaxYear`, `CompanyProfile`, `TaxRegime` e regimes, `TaxStrategy`, repositório em memória da transição CBS/IBS e `GET /v1/health`.
- Lint de arquitetura (OO e camadas), testes com cobertura mínima de 80% e CI.
