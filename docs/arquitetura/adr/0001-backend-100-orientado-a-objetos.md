# ADR-0001 — Backend 100% orientado a objetos

- **Status:** Aceito
- **Requisitos:** RNF-01, RNF-08

## Contexto
O projeto é uma vitrine de modelagem de domínio. Regras fiscais mudam por ano e por regime, e precisam ser trocáveis e testáveis isoladamente.

## Decisão
Todo arquivo do backend declara classes (ou interfaces implementadas por classes). Sem funções ou constantes soltas exportadas; apenas `src/main.ts` é procedural, para compor e subir o servidor. Padrões: Strategy (um tributo por classe), Template Method (`TaxRegime.simulate`), herança só para "é um" real (`SimplesHibrido` herda `SimplesNacional`), Repository (portas no domínio) e raiz de composição. Camadas: `domain` ← `application` ← `infrastructure` e `presentation`.

## Consequências
Regras verificadas por lint (`no-restricted-syntax`) e por `dependency-cruiser` no CI. Há mais cerimônia que em código funcional, aceita em troca de clareza e extensibilidade.
