# ADR-0003 — Dinheiro em centavos (`bigint`) e alíquotas inteiras

- **Status:** Aceito
- **Requisitos:** RNF-02, RN-03

## Decisão
`Money` guarda centavos em `bigint`; `TaxRate` guarda milionésimos em `bigint` (4 casas percentuais). Multiplicação por razão racional com arredondamento meio para cima, centralizado em `Money.multiplyByRatio`. Entrada e saída em texto decimal; `number` nunca representa dinheiro.

## Consequências
Resultados reproduzíveis e auditáveis. Qualquer mudança de regra de arredondamento exige novo ADR.
