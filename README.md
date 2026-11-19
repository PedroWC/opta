# Opta

Simulador de regimes tributários na Reforma Tributária do Consumo. Compara **Simples Nacional**, **Simples híbrido** (CBS/IBS recolhidos por fora do DAS) e **Lucro Presumido**, ano a ano de 2026 a 2033, e recomenda o melhor regime. O diferencial é mostrar quando vale optar por IBS/CBS por fora.

> Projeto educacional de portfólio, **não** é consultoria tributária. Regras com ⚠️ nos documentos ainda precisam de conferência na fonte legal.

## Estado

Backend com tipos de domínio (`Money`, `TaxRate`, `TaxYear`, `CompanyProfile`), regimes abstratos (Template Method), estratégias de tributo, repositório em memória e `GET /v1/health`. O **Simples Nacional puro (Anexos III e V, Fator R e partilha do DAS)** já calcula de 2026 a 2033; o **Lucro Presumido** e o **Simples híbrido** também calculam; o comparador e a API seguem no [backlog](docs/processo/backlog-inicial.md).

## Como rodar

Requisitos: Node 22 ou superior.

```bash
npm install
npm run check      # tipos, lint (OO e camadas) e testes com cobertura
npm run mutation   # testes de mutação do núcleo (lento; limiar no ADR-0007)
npm run dev        # http://localhost:3000/v1/health e POST /v1/simulacoes (contrato em docs/api/openapi.yaml)
```

## Persistência

`OPTA_DB=memory` (padrão), `sqlite` ou `oracle` escolhe o repositório das tabelas fiscais; veja [persistência](docs/arquitetura/persistencia.md). Exemplo: `OPTA_DB=sqlite npm run dev` (cria `opta.db`, que o git ignora).

## Arquitetura

Backend 100% orientado a objetos (ADR-0001), em camadas: `src/domain` ← `src/application` ← `src/infrastructure` e `src/presentation`; `src/composition-root.ts` monta as dependências e `src/main.ts` sobe o servidor.

## Documentação

- [Especificação](docs/especificacao.md)
- [Requisitos](docs/requisitos/ers.md) · [Regras de negócio](docs/requisitos/regras-de-negocio.md) · [Rastreabilidade](docs/requisitos/rastreabilidade.md)
- [Casos de uso](docs/produto/casos-de-uso.md) · [Histórias](docs/produto/historias-de-usuario.md) · [Mapa do site](docs/produto/mapa-do-site.md)
- [Contrato da API (OpenAPI 3.1)](docs/api/openapi.yaml)
- [ADRs](docs/arquitetura/adr/README.md) · [Glossário](docs/arquitetura/glossario.md)
- [Backlog inicial](docs/processo/backlog-inicial.md) · [Nomenclatura](docs/processo/nomenclatura.md) · [Definição de pronto](docs/processo/definicao-de-pronto.md)
- [Plano do front-end](docs/frontend/plano-frontend.md) · [Wireframes](docs/prototipos/wireframes-simulador.md) · [Backlog do front-end](docs/frontend/backlog-frontend.md) · [Registro de decisões](docs/processo/registro-de-decisoes.md)
